function MyCalc(number)
{
	this.number = number;
}

MyCalc.prototype = {
	add: function (number) {
		this.number += number;
	},
	result: function () {
		return this.number;
	}
};