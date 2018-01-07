# xcfunctions.js

XComponent.Functions JS client library

Since version 5.0, XComponent allows one to implement microservices in any programming language. This is done by means of the new  *REST*  triggered methods; in opposition to the standard *Native* ones, generated automatically by XComponent's build tool chain and implemented in C#.

REST triggered methods are implemented by any programming language able to speak REST.

The present library abstracts away from the REST protocol and allows developers to write code that reads and behaves very close to the way triggered methods were traditionally written.

## Programming model

This library implements an event queue that periodically polls the REST server looking for triggered methods to execute. 

As a developer, you must register a set of triggered methods to execute and then start the event queue.

## Limitations

The current library is very limited.  It only supports REST servers bound to the default address (`127.0.0.1:9676`). The event queue polls the server on a non configurable frequency of 1 call per second.

## Install

With [npm](https://npmjs.org) do:

`npm install xcfunctions`

## Methods

### registerTriggeredMethods(componentName, stateMachineName, triggeredMethod)

Registered a set of triggered methods and associate them to the provided component/state machine pair.

The triggered method object is a dictionary whose keys are the names of the triggered method and value is a triggered method implementation function.

A triggered method implementation function is a function with the following signature:

```js
function name(event, publicMember, internalMember, context, sender);
```

- `event` is the object that triggered the transition;
- `publicMember` and `internalMember` are respectively the public and internal members of the state machine when the transition was triggered.
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

### startEventQueue()

Starts the event queue that polls the REST service for triggered methods to execute.


## Writting triggered methods

### Entry point triggered methods

### Public member initializers

## License

Apache 2.0
