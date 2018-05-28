[![](http://slack.xcomponent.com/badge.svg)](http://slack.xcomponent.com/)
[![npm](https://img.shields.io/npm/v/xcfunctions.svg)](https://www.npmjs.com/package/xcfunctions)
[![Build Status](https://travis-ci.org/xcomponent/xcfunctions.js.svg?branch=master)](https://travis-ci.org/xcomponent/xcfunctions.js)

# xcfunctions.js

XComponent REST triggered methods JavaScript client library

Since version 5.0, XComponent allows one to implement microservices in any programming language. This is done by means of the new  *REST*  triggered methods, in opposition to the standard *Native* ones, generated automatically by XComponent's build tool chain and implemented in C#.

The present library abstracts away from XComponent's REST API and allows developers to write code that reads and behaves very close to the way native triggered methods are written.

## Programming model

This library implements an event queue that periodically polls the REST server looking for triggered methods to execute. 

As a developer, you must register a set of triggered methods implementation functions associating them to the component's state machines and then start the event queue. The associated functions will then ben called when a triggered method needs to be executed server side. Functions can update state machine's public and internal member and trigger senders.

## Limitations

- The event queue polls the server on a non configurable frequency of 1 call per second;
- Keys on objects received/sent from/to the REST server are case sensitive and follow C# naming conventions;
- Sender calls are **NOT** performed asynchronously. All calls are performed in the order they were performed by the triggered method, i.e. once the function returns.

## Install

With [npm](https://npmjs.org) do:

`npm install xcfunctions`

## Methods

### registerTriggeredMethods(componentName, stateMachineName, triggeredMethod)

Registers a set of triggered method implementation functions and associate them to triggered methods in the provided component/state machine pair.

`triggeredMethod` is a dictionary whose keys are the names of the triggered methods and values are triggered method implementation functions.

Triggered methods are named following this pattern (special cases will be listed on next section):

`ExecuteOn_ToStateName_From_FromStateName_Through_TransitionName`

For a transition named `TransitioName`, from state `FromStateName` to `ToStateName`.

If the code of the trigger method is asynchronous, add done parameter and call it back at the end of the execution.

The following code snippet illustrates a call to the `registerTriggeredMethods(...)` method:

```js
xcfunctions.registerTriggeredMethods('Component', 'StateMachine', {
    ExecuteOn_EntryPoint: (event, publicMember, internalMember, context, sender, stringResources) => {
        ...
    },

    ExecuteOn_S0_From_S1_Through_T: (event, publicMember, internalMember, context, sender, stringResources) => {
        ...
    },

    ExecuteOn_S2_From_S1_Through_T2: (event, publicMember, internalMember, context, sender, stringResources, done) => {
        done();
    },

    ...
});
```

### startEventQueue(configuration, callback)

Starts the event queue that polls the REST service for triggered methods to execute.

The `configuration` parameter is optional and it has the following structure:

```js
configuration = {
    port:, number,
    host: string,
    timeoutInMillis: number,
}
```

Where:
- `timeoutInMillis`: is the timeout for the execution of triggered methods defined in milliseconds; its default value is 1000ms.
- `port`: is the port where the state machine is exposed on the server; its default value is 9676.
- `host`: is the host name where the state machine is exposed on the server; its default value is `127.0.0.1`.

The `callback` parameter is optional and allows one to detect initialization errors, and to be notified when polling started.
It has the following signature:

```js
function callback(error, success) {
    if (error) {
        // erro contains the error message
    } else if (success) {
        // event queue ready and polling started
    }
}
```

## Writing triggered method implementation functions

A triggered method implementation function has the following signature:

```js
(event, publicMember, internalMember, context, sender, stringResources) => {
    ...
}
```

Where:

- `event` is the event object that triggered the transition;
- `publicMember` and `internalMember` are respectively the public and internal members of the state machine when the transition was triggered. **NOTE: These objects may be modified by the function code, modifications will be transferred to state machine.**
- `context` represents the execution context of the state machine, with the following structure:

```js
{
    PublishNotification: boolean,
    StateMachineId: number
    WorkerId: number
    StateCode: number
    StateMachineCode: number,
    ComponentCode: number,
    PrivateTopic: string,
    MessageType: string,
    ErrorMessage: string,
    SessionData: string 
}
```

- `sender` is the object used to trigger sender calls, use it as follows:

```js
sender.transitionName(sentEvent, useContext);
```

Where `transitionName` is the name of the transition to trigger, `sentEvent` represents the event to be sent to trigger the transition and `useContext` is a boolean indicating if the event should be forwarded only to the current state machine (`true`) or to all state machines of the same type (`false`). 

- `stringResources` is an object that contains the string resources configured for the component. Strings resources are a per component key value store that store the configuration of each XComponent component. It is read on the runtime startup and is immutable.

### Special transitions

- **Entry point triggered methods**: these transitions are executed once per component, when its entry point state machine is instantiated. The triggered method should be called `ExecuteOn_EntryPoint` and its triggering event is an empty object, and should therefore be ignored.

- **Public member initializers**: these transitions are executed when a forked state machine is created. The triggered method should be called `InitializePublicMember`. This method should initialize the child state machine's public and internal members from its parent's. The received event has the following structure:

```js
{
    ParentPublicMember: {
        ...
    },
    ParentInternalMember: {
        ...
    } 
}
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

Apache 2.0
