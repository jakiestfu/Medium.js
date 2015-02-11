
(function(Medium) {
	"use strict";

	/**
	 * @param {Medium} medium
	 * @constructor
	 */
	Medium.Undoable = function (medium) {
		var me = this,
			element = medium.settings.element,
			timer,
			startValue,
			stack = new Undo.Stack(),
			EditCommand = Undo.Command.extend({
				constructor: function (oldValue, newValue) {
					this.oldValue = oldValue;
					this.newValue = newValue;
				},
				execute: function () {
				},
				undo: function () {
					element.innerHTML = this.oldValue;
					medium.canUndo = stack.canUndo();
					medium.canRedo = stack.canRedo();
					medium.dirty = stack.dirty();
				},
				redo: function () {
					element.innerHTML = this.newValue;
					medium.canUndo = stack.canUndo();
					medium.canRedo = stack.canRedo();
					medium.dirty = stack.dirty();
				}
			}),
			makeUndoable = function (isInit) {
				var newValue = element.innerHTML;

				if (isInit) {
					startValue = element.innerHTML;
					stack.execute(new EditCommand(startValue, startValue));
				}

				// ignore meta key presses
				else if (newValue != startValue) {

					if (!me.movingThroughStack) {
						// this could try and make a diff instead of storing snapshots
						stack.execute(new EditCommand(startValue, newValue));
						startValue = newValue;
						medium.dirty = stack.dirty();
					}

					utils.triggerEvent(medium.settings.element, "change");
				}
			};

		this.medium = medium;
		this.timer = timer;
		this.stack = stack;
		this.makeUndoable = makeUndoable;
		this.EditCommand = EditCommand;
		this.movingThroughStack = false;

		utils
			.addEvent(element, 'keyup', function (e) {
				if (e.ctrlKey || e.keyCode === key.z) {
					utils.preventDefaultEvent(e);
					return;
				}

				// a way too simple algorithm in place of single-character undo
				clearTimeout(timer);
				timer = setTimeout(function () {
					makeUndoable();
				}, 250);
			})

			.addEvent(element, 'keydown', function (e) {
				if (!e.ctrlKey || e.keyCode !== key.z) {
					me.movingThroughStack = false;
					return;
				}

				utils.preventDefaultEvent(e);

				me.movingThroughStack = true;

				if (e.shiftKey) {
					stack.canRedo() && stack.redo()
				} else {
					stack.canUndo() && stack.undo();
				}
			});
	};
})(Medium);
