
rangy.rangePrototype.insertNodeAtEnd = function (node) {
	var range = this.cloneRange();
	range.collapse(false);
	range.insertNode(node);
	range.detach();
	this.setEndAfter(node);
};
