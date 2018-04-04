'use strict';

const xcfunctions = require('xcfunctions');
const nock = require('nock');

jest.useFakeTimers();

afterEach(() => {
    nock.cleanAll();
    jest.clearAllTimers();
});

/*test('getAllStringResources', done => {
    nock('http://127.0.0.1:9676')
    .get('/api/StringResources')
    .reply(200, [{ ComponentName: 'HW', Key: 'PORT', Value: '7890' }]);

    xcfunctions.getAllStringResources((err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        done();
    });
});*/

test('triggered method call', done => {
    nock('http://127.0.0.1:9676')
    .get('/api/StringResources')
    .reply(200, []);

    nock('http://127.0.0.1:9676')
        .get('/api/Functions?componentName=Component&stateMachineName=StateMachine')
        .reply(200,
            {
                Event: { Code: 0 },
                PublicMember: { Code: 1 },
                InternalMember: { Code: 2 },
                Context: {
                    PublishNotification: true,
                    StateMachineId: 2,
                    WorkerId: 3,
                    StateCode: 1,
                    StateMachineCode: 93084851,
                    ComponentCode: 93084851,
                    PrivateTopic: 'private',
                    MessageType: 'event.type.name.Name',
                    ErrorMessage: 'error',
                    SessionData: 'data'
                },
                ComponentName: 'Component',
                StateMachineName: 'StateMachine',
                FunctionName: 'TriggeredMethod',
                RequestId: 'requestId'
            });

    nock('http://127.0.0.1:9676')
        .post('/api/Functions')
        .reply(204, (uri, body) => {
            expect(body.PublicMember.Code).toBe(2);
            expect(body.InternalMember.Code).toBe(3);
            expect(body.ComponentName).toBe('Component');
            expect(body.StateMachineName).toBe('StateMachine');
            expect(body.RequestId).toBe('requestId');
            expect(body.Senders.length).toBe(0);
            expect(body.IsError).toBeFalsy();
            expect(body.ErrorMessage).toBeFalsy();

            done();
            return {};
        });
    
    xcfunctions.registerTriggeredMethods(
        'Component',
        'StateMachine',
        {
            'TriggeredMethod': (event, publicMember, internalMember, context, sender) => {
                expect(event.Code).toBe(0);
                expect(publicMember.Code).toBe(1);
                expect(internalMember.Code).toBe(2);
                expect(context.PublishNotification).toBeTruthy();
                expect(context.StateMachineId).toBe(2);
                expect(context.WorkerId).toBe(3);
                expect(context.StateCode).toBe(1);
                expect(context.StateMachineCode).toBe(93084851);
                expect(context.ComponentCode).toBe(93084851);
                expect(context.PrivateTopic).toBe('private');
                expect(context.MessageType).toBe('event.type.name.Name');
                expect(context.ErrorMessage).toBe('error');
                expect(context.SessionData).toBe('data');

                publicMember.Code++;
                internalMember.Code++;
            }
        });

    xcfunctions.startEventQueue();

    jest.runOnlyPendingTimers();
});

/*test('error handling', done => {
    nock('http://127.0.0.1:9676')
        .get('/api/Functions?componentName=Component&stateMachineName=StateMachine')
        .reply(200,
            {
                Event: { Code: 0 },
                PublicMember: { Code: 1 },
                InternalMember: { Code: 2 },
                Context: {
                    PublishNotification: true,
                    StateMachineId: 2,
                    WorkerId: 3,
                    StateCode: 1,
                    StateMachineCode: 93084851,
                    ComponentCode: 93084851,
                    PrivateTopic: 'private',
                    MessageType: 'event.type.name.Name',
                    ErrorMessage: 'error',
                    SessionData: 'data'
                },
                ComponentName: 'Component',
                StateMachineName: 'StateMachine',
                FunctionName: 'TriggeredMethod',
                RequestId: 'requestId'
            });

    nock('http://127.0.0.1:9676')
        .post('/api/Functions')
        .reply(204, (uri, body) => {
            expect(body.IsError).toBeTruthy();
            expect(body.ErrorMessage).toBeDefined();

            done();
            return {};
        });

    xcfunctions.registerTriggeredMethods(
        'Component',
        'StateMachine',
        {
            'TriggeredMethod': (event, publicMember, internalMember, context, sender) => {
                throw "error";
            }
        });

    xcfunctions.startEventQueue();

    jest.runOnlyPendingTimers();
});

test('configuration update on event queue start', done => {
    nock('http://127.0.0.1:9676')
        .get('/api/Functions?componentName=Component&stateMachineName=StateMachine')
        .reply(204);

    nock('http://127.0.0.1:9676')
        .post('/api/Configuration')
        .reply(204, (uri, body) => {
            expect(body.TimeoutInMillis).toBe(1000);
            done();
            return {};
        });

    xcfunctions.startEventQueue({
        TimeoutInMillis: 1000
    });
});

test('Test get string resources', done => {
    const expectedJsonData = [{ ComponentName: 'HW', Key: 'PORT', Value: '7890' }];
    nock('http://127.0.0.1:9676')
        .get('/api/StringResources')
        .reply(204, expectedJsonData);

    expect(xcfunctions.getStringResource('HW', 'PORT')).toEqual('7890');
    done();

    xcfunctions.startEventQueue({
        TimeoutInMillis: 1000
    });
});

test('configuration update on event queue start with a modified configuration', done => {
    const port = 9999;
    const host = 'localhost';
    const url = 'http://' + host + ':' + port;

    nock(url)
        .get('/api/Functions?componentName=Component&stateMachineName=StateMachine')
        .reply(204);

    nock(url)
        .post('/api/Configuration')
        .reply(204, (uri, body) => {
            expect(body.TimeoutInMillis).toBe(1000);
            done();
            return {};
        });

    xcfunctions.startEventQueue({
        TimeoutInMillis: 1000,
        port: port,
        host: host
    });
});*/


