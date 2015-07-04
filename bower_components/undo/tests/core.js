module("core");

var NameChange = Undo.Command.extend({
	constructor: function(object, newName) {
		NameChange.__super__.constructor("Name change to " + newName);
		this.object = object;
		this.oldName = object.name;
		this.newName = newName;
	},
	execute: function() {
		this.object.name = this.newName;
	},
	undo: function() {
		this.object.name = this.oldName;
	}
});

test("Command.extend", function() {
	var object = {
		name: "Peter"
	}
	var command = new NameChange(object, "Pan");
	equal(command.name, "Name change to Pan");
	equal(object.name, "Peter");

	command.execute();
	equal(object.name, "Pan");
	
	command.undo();
	equal(object.name, "Peter");
	
	command.redo();
	equal(object.name, "Pan");
});

test("Stack", function() {
	var object = {
		name: "Peter"
	}
	var command = new NameChange(object, "Pawn");
	var stack = new Undo.Stack();
	
	
	stack.execute(command);
	equal(object.name, "Pawn");
	ok( stack.dirty() );
	ok( stack.canUndo() );
	ok( !stack.canRedo() );
	
	stack.save();
	ok( !stack.dirty() );
	ok( stack.canUndo() );
	ok( !stack.canRedo() );

	stack.undo();
	equal(object.name, "Peter");
	ok( stack.dirty() );
	ok( !stack.canUndo() );
	ok( stack.canRedo() );

	stack.redo();
	equal(object.name, "Pawn");
	ok( !stack.dirty() );
	ok( stack.canUndo() );
	ok( !stack.canRedo() );
});

test("Stack._clearRedo", function() {
	var object = {
		name: "Peter"
	}
	var command = new NameChange(object, "p0wn");
	var stack = new Undo.Stack();
	
	stack.execute(command)
	stack.execute(command)
	stack.execute(command)
	stack.undo();
	stack.undo();
	stack.undo();
	
	stack.execute(command);
	ok( !stack.canRedo() );
});
