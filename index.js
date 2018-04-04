/* jshint esversion: 6 */

const http = require('http');
const request = require('sync-request');

const nullBodyError = 'Body is null';

const defaultConfig = {
    host: '127.0.0.1',
    port: 9676
};

setConfig = (config) => {
    if (!config) {
        return;
    }
    defaultConfig.host = (config.host) ? config.host : defaultConfig.host;
    defaultConfig.port = (config.port) ? config.port : defaultConfig.port;
};

const getConfig = () => {
    return defaultConfig;
};

var stringResources = null;
const getStringResource = (component, key) => {
    if (!stringResources) {
        return null;
    }
    const resource = stringResources.filter(s => s.ComponentName == component && s.Key == key);
    if (resource.length == 0) {
        return null;
    } else {
        return resource[0].Value;
    }
};
exports.getStringResource = getStringResource;

function getAllStringResources(callback) {
    const options = {
        host: getConfig().host,
        port: getConfig().port,
        path: '/api/StringResources',
        method: 'GET'
    };
    console.log(options);
    http
        .request(options, function (response) {
            let body = '';
            response.on('data', (data) => {
                body += data;
            });
            response.on('end', () => {
                if (body === 'null') {
                    callback(nullBodyError, null);
                    return;
                }

                try {
                    callback(null, JSON.parse(body));

                } catch (e) {
                    callback(e, null);
                }
            });
            response.on('error', callback);
        })
        .on('error', callback)
        .end();
}
exports.getAllStringResources = getAllStringResources;


function getTask(componentName, stateMachineName, callback) {
    const getOptions = (componentName, stateMachineName) => {
        return {
            host: getConfig().host,
            port: getConfig().port,
            path: '/api/Functions?componentName=' + escape(componentName) + '&stateMachineName=' + escape(stateMachineName),
            method: 'GET'
        };
    };

    http
        .request(getOptions(componentName, stateMachineName), function (response) {
            let body = '';
            response.on('data', (data) => {
                body += data;
            });
            response.on('end', () => {
                if (body === 'null') {
                    callback(nullBodyError, null);
                    return;
                }

                try {
                    callback(null, JSON.parse(body));
                } catch (e) {
                    callback(e, null);
                }
            });
            response.on('error', callback);
        })
        .on('error', callback)
        .end();
}

function postObject(object, endpoint, callback) {
    const postOptions = {
        host: getConfig().host,
        port: getConfig().port,
        path: '/api/' + endpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const request = http.request(postOptions, function (response) {
        if (response.statusCode != 204) {
            if (callback) callback(response.statusCode);
        } else {
            if (callback) callback(null, response.statusCode);
        }
    });

    request.on('error', function (error) {
        if (callback) callback(error);
    });

    request.write(JSON.stringify(object));
    request.end();
}

function postConfiguration(configurationObject, callback) {
    postObject(configurationObject, 'Configuration', callback);
}

function postResult(responseObject, callback) {
    postObject(responseObject, 'Functions', callback);
}

const triggeredMethods = {};

exports.registerTriggeredMethod = (componentName, stateMachineName, triggeredMethodName, triggeredMethodFunction) => {
    if (!(componentName in triggeredMethods)) {
        triggeredMethods[componentName] = {};
    }
    if (!(stateMachineName in triggeredMethods[componentName])) {
        triggeredMethods[componentName][stateMachineName] = {};
    }

    triggeredMethods[componentName][stateMachineName][triggeredMethodName] = triggeredMethodFunction;
};

exports.registerTriggeredMethods = (componentName, stateMachineName, triggeredMethods) => {
    for (const triggeredMethodName in triggeredMethods) {
        exports.registerTriggeredMethod(componentName, stateMachineName, triggeredMethodName, triggeredMethods[triggeredMethodName]);
    }
}

exports.startEventQueue = (configuration) => {
    console.log('Registered triggered methods: ', triggeredMethods);
    const retryIntervalSeconds = 5;

    const installEventQueue = () => {
        console.log('installEventQueue');
        setInterval(() => {
            console.log('WWWWWWWWWWWWWWW');
            eventQueue();
        }, 1000);
        console.log('Waiting for tasks...');
    };

    const start = () => {
        console.log("start", configuration);
        if (configuration) {
            setConfig(configuration);
            const postConfigurationAction = () => postConfiguration(configuration, configurationCallback);
            let configurationTimerID = null;
            const configurationCallback = (error) => {
                if (error) {
                    console.error('Error updating configuration: ', error);
                    console.error('Retrying in ', retryIntervalSeconds, 's...');
                    configurationTimerID = setTimeout(postConfigurationAction, retryIntervalSeconds * 1000);
                    return;
                }

                clearTimeout(configurationTimerID);
                console.log('Configuraton successfuly updated!');
                installEventQueue();
            };
            postConfigurationAction();
            configurationTimerID = setTimeout(postConfigurationAction, retryIntervalSeconds * 1000);
        } else {
            installEventQueue();
            console.log('Waiting for tasks...');
        }
    };

    let stringResourcesTimerID = null;
    const getAllStringResourcesCallback = (err, data) => {
        if (err) {
            console.error(data);
            console.error('Error getting string resources: ', err);
            console.error('Retrying in ', retryIntervalSeconds, 's...');
            stringResourcesTimerID = setTimeout(getAllStringResourcesCallback, retryIntervalSeconds * 1000);
            return;
        }
        // clearTimeout(stringResourcesTimerID);
        console.log('String Resources successfuly updated!');
        stringResources = data;
        start();
    }
    getAllStringResources(getAllStringResourcesCallback);

    //setTimeout(start, 0);
    //start();
};

function senderHandler(target, name) {
    return (parameter, useContext) => {
        target.Senders.push({
            SenderName: name,
            SenderParameter: parameter || {},
            UseContext: useContext || false
        });
    };
}

function eventQueue() {
    console.log("eventQueue!!!!!!!!!!!!!!!!")
    for (const componentName in triggeredMethods) {
        for (const stateMachineName in triggeredMethods[componentName]) {
            getTask(componentName, stateMachineName, (error, task) => {
                if (error) {
                    console.log('EEEEEERRRRRRRRRRRRRRRRRR');
                    if (error !== nullBodyError && !(error.code && error.code === 'ECONNREFUSED')) {
                        console.error(error);
                    }
                    return;
                }

                console.log('Received task: ', task);

                if (!(task.FunctionName in triggeredMethods[componentName][stateMachineName])) {
                    console.error('Received task for unregistered function', task.FunctionName);
                    return;
                }

                const triggeredMethod = triggeredMethods[componentName][stateMachineName][task.FunctionName];
                const sendersList = [];
                const sender = new Proxy({ Senders: sendersList }, { get: senderHandler });

                try {
                    triggeredMethod(task.Event, task.PublicMember, task.InternalMember, task.Context, sender);
                } catch (e) {
                    console.error("Caught exception", e);
                    error = e;
                }

                if (!error) {
                    postResult({
                        // jshint ignore:start
                        Senders: sendersList,
                        PublicMember: task.PublicMember,
                        InternalMember: task.InternalMember,
                        ComponentName: task.ComponentName,
                        StateMachineName: task.StateMachineName,
                        RequestId: task.RequestId
                        // jshint ignore:end
                    });
                } else {
                    postResult({
                        // jshint ignore:start
                        IsError: true,
                        ErrorMessage: "" + error
                        // jshint ignore:end
                    });
                }
            });
        }
    }
}

