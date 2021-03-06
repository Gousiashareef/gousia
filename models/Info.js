var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Info= new Schema({

name:{
		type:String,
		required:true,
		//unique:true
	},
link:{
		type:String,
		require:true
	},
hour:{
		type:Number,
		required:true	
	},
min:{
		type:Number,
		required:true
	},
meridiem:{
		type:String,
		required:true
	},

year:{
		type:Number,
		required:true
	},
month:{
		type:Number,
		required:true
	},
date:{
		type:Number,
		required:true
	}
});



module.exports.inform = mongoose.model('Info',Info);	
