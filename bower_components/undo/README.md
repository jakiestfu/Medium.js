# Undo.js

Undo.js provides an abstraction for undoing and redoing any task. It can run both in the browser and on the server (targetted at node.js).
It can be used to add undo and redo features to a custom application, e.g. undo and redo changing the priority of a task in a TODO list.
It can also be used to undo and redo native browser features: Clicking a checkbox, editing a textbox and eventually, editing a contenteditable element.

The base abstraction will stay independent of any framework, while plugins, like a command editing a sortable list, will likely depend on libraries such as jQuery.

## Installation

Via npm: `npm install undo.js`

## Roadmap for demos to add:

- Extend sortable list demo with jQuery UI sortable
- form: track all form changes: text input, checkbox change, radio change, select change
- add undo/redo to Backbone TODO demo
- contenteditable with bold command

## Demos:

http://jzaefferer.github.com/undo/demos/
http://jzaefferer.github.com/undo/demos/contenteditable.html

## To suggest a feature, report a bug, or general discussion:

http://github.com/jzaefferer/undo/issues/
