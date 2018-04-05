'use strict';

const xcfunctions = require('xcfunctions');
const nock = require('nock');

jest.useFakeTimers();

afterEach(() => {
    nock.cleanAll();
    jest.clearAllTimers();
});

test('triggered method call', done => {
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

    const expectedJsonData = [{ ComponentName: 'Component', Key: 'PORT', Value: '8080' }];
    nock('http://127.0.0.1:9676')
        .get('/api/StringResources')
        .reply(204, expectedJsonData);

    nock('http://127.0.0.1:9676')
        .post('/api/Configuration')
        .reply(204, (uri, body) => {
            expect(body.timeoutInMillis).toBe(1000);
            done();
            return {};
        });

    xcfunctions.registerTriggeredMethods(
        'Component',
        'StateMachine',
        {
            'TriggeredMethod': (event, publicMember, internalMember, context, sender, stringResources) => {
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
                expect(stringResources.PORT).toBe('8080');

                publicMember.Code++;
                internalMember.Code++;
            }
        });

    xcfunctions.startEventQueue(null, () => {
        jest.runOnlyPendingTimers();
    });
});

test('error handling', done => {
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

    nock('http://127.0.0.1:9676')
        .get('/api/StringResources')
        .reply(204, []);

    xcfunctions.registerTriggeredMethods(
        'Component',
        'StateMachine',
        {
            'TriggeredMethod': (event, publicMember, internalMember, context, sender, stringResources) => {
                throw "error";
            }
        });

    xcfunctions.startEventQueue(null, () => {
        jest.runOnlyPendingTimers();
    });

});

test('configuration update on event queue start', done => {
    nock('http://127.0.0.1:9676')
        .get('/api/StringResources')
        .reply(204, []);

    nock('http://127.0.0.1:9676')
        .get('/api/Functions?componentName=Component&stateMachineName=StateMachine')
        .reply(204);

    nock('http://127.0.0.1:9676')
        .post('/api/Configuration')
        .reply(204, (uri, body) => {
            expect(body.timeoutInMillis).toBe(1000);
            return {};
        });

    xcfunctions.startEventQueue({
        timeoutInMillis: 1000
    }, () => {
        done();
    });
});

test('configuration update on event queue start with a modified configuration', done => {
    const port = 9676;
    const host = 'localhost';
    const url = 'http://' + host + ':' + port;

    nock(url)
        .get('/api/StringResources')
        .reply(204, []);

    nock(url)
        .get('/api/Functions?componentName=Component&stateMachineName=StateMachine')
        .reply(204);

    nock(url)
        .post('/api/Configuration')
        .reply(204, (uri, body) => {
            expect(body.timeoutInMillis).toBe(1000);
            done();
            return {};
        });
    xcfunctions.startEventQueue({
        timeoutInMillis: 1000,
        port: port,
        host: host
    });
});
