
//常规类型
var intTypes_ = {
"char":"int",
"short":"int",
"int":"int",
"long":"int64_t",
"int8":"char",
"int16":"short",
"int32":"int",
"int64":"int64_t",	
"uint8":"unsigned char",
"uint16":"unsigned short",
"uint32":"unsigned int",
"uint64":"uint64_t"
};


var boolTypes_ = {
"boolean":"bool",
"bool":"bool"
};

var realTypes_ = {
"float":"float",
"double":"double",
"number":"double"
};


//函数参数类型
var argTypes_ = {
"buffer":"const Buffer&",	
"string":"const char*"
};

//返回值类型
var retTypes_ = {
"buffer":"Buffer",
"string":"String"
};


//函数开头标识
var apiPrefix_ = "";

//全局引用类名
var globalRefClass_ = "DukGlobalRef";

//回调函数类型名
var callbackName_ = "Callback";

var unknownTypes_ = {};

//获取未知类型
function getUnknownTypes(){
	return unknownTypes_;
}

function clearUnknownTypes(){
	unknownTypes_ = {};
}

function getCallbackType(t){
	var index1 = t.indexOf("<");
	var index2 = t.indexOf(">");
	var argtypestr = "";
	if(index1>0 && index2>index1){
		argtypestr = t.substr(index1+1, index2 - index1-1);
	}
	var argtypes = argtypestr.split(",");
	var argcount = argtypes.length;
	if(argtypestr.length==0)argcount = 0;
	
	var ret = "std::function<void(";
	for(var i =0;i<argcount;i++){
		if(i>0)ret += ",";
		ret += getType(argtypes[i], true);		
	}
	ret += ")>";
	return ret;
}

//获取对应的cxx类型
function getType(t, isarg){
	if(t.indexOf(callbackName_)==0){ //回调函数特殊
		return getCallbackType(t);
	}	
	var lt = t.toLowerCase();
	if(lt == "void")return "void";
	if(lt == "intptr"||lt == "pointer")return "void*";	

	if(isarg){
		if(argTypes_[lt])return argTypes_[lt];
	}else{
		if(retTypes_[lt])return retTypes_[lt];
	}
	if(intTypes_[lt])return intTypes_[lt];
	if(boolTypes_[lt])return boolTypes_[lt];
	if(realTypes_[lt])return realTypes_[lt];
	
	//其它的未知类型作为指针
	var ret = t + "Ptr";
	//缓存未知类型
	unknownTypes_[t] = ret;
	return ret;
};

//获取默认值
function getDefaultValue(t){
	if(intTypes_[t])return "0";
	if(boolTypes_[t])return "false";
	if(realTypes_[t])return "0.0f";	
	return "";
};

function isEmptyString(obj){
	return !(obj && obj.length);
}

function isDestructible(iface){
	if(iface.extended.indexOf("destructible")>=0){
		return true;
	}
	return false;
}






//转换一个纯数据的结构体为c++代码
function convertCXXStruct(iface){
	var defaultValue = "";	
	var memberField = "";
	
	for(var i=0;i<iface.attributes.length; i++){
		var attr = iface.attributes[i];		
		var value = getDefaultValue(attr.type);
		if(value.length){
			defaultValue += `        ${attr.name} = ${value};\n`;
		}
		memberField += `    ${getType(attr.type,false)} ${attr.name};\n`;		
	}
	
	var extendsstr = "";
	if(!isEmptyString(iface.superName)){
		extendsstr = " : public " + iface.superName;
	}
			
	var ret = "";
	ret += `class ${iface.name} ${extendsstr} {\n`;
	ret += `public:\n`;
	ret += `    ${iface.name}(){\n`;
	ret += defaultValue;
	ret += `    }\n`;
	ret += `\n`;
	ret += memberField;
	ret += `};\n`;
	ret += `typedef std::shared_ptr<${iface.name}> ${iface.name}Ptr;\n`;
    ret += `\n`;

	return ret;
}


//转换一个成员常量
function convertCXXConstant(iface, consts){
	var name = iface.name.toUpperCase() + "_" + consts.name;
	var ret = `#define ${name} ${consts.value}\n`;
	return ret;
}

//转换一个成员变量
function convertCXXAttribute(iface, attr){
	var getname = iface.name + "_get_" + attr.name;
	var setname = iface.name + "_set_" + attr.name;
    var pthisarg = "";	
	if(!attr.isStatic){
		pthisarg = `${getType(iface.name)} pThis`;
	}
	var ret = "";
	
	if(!attr.isWriteonly){
		ret += `${apiPrefix_}${getType(attr.type)} ${getname}(${pthisarg});\n`
	}	
	if(!attr.isReadonly){
		ret += `${apiPrefix_}void ${setname}(${pthisarg.length?(pthisarg+","):""} ${getType(attr.type, true)} arg);\n`
	}
	
	ret += "\n";
	return ret;
}


//转换一个成员函数
function convertCXXOperation(iface, func){
	var name = iface.name + "_" + func.name;
	
	var argstr = "";
	var hasarg = false;
    var pthisarg = "";	
	if(!func.isStatic){
		pthisarg = `${getType(iface.name)} pThis`;
		hasarg = true;
		argstr += pthisarg;
	}	
	
	for(var i=0;i<func.arguments.length; i++){
		var arg = func.arguments[i]; 
		if(hasarg){
			argstr += ", ";
		}
		argstr += `${getType(arg.type, true)} ${arg.name}`;
		hasarg = true;
	}
	var ret = "";
	ret += `${apiPrefix_}${getType(func.type)} ${name}(${argstr});\n`
	ret += "\n";
	return ret;
}

//转换一个interface为c++代码
function convertCXXInterface(iface){
	var consts = "";
	var funcs = "";
	var attrs = "";
	
	for(var i=0;i<iface.constants.length; i++){
		var cont = iface.constants[i]; 
		consts += convertCXXConstant(iface, cont);
	}	
	for(var i=0;i<iface.attributes.length; i++){
		var attr = iface.attributes[i]; 
		attrs += convertCXXAttribute(iface, attr);
	}
	for(var i=0;i<iface.operations.length; i++){
		var func = iface.operations[i]; 
		funcs += convertCXXOperation(iface, func);
	}
	
	var ret = "";
	ret += "// constants \n"
	ret += consts;
	ret += "\n";
	ret += "// virtual properties \n"
	ret += attrs;	
	ret += "\n";
	ret += "// member functions \n"
	ret += funcs;	
	ret += "\n";
	if(isDestructible(iface)){
		ret += "// destructor \n"
		ret += `${apiPrefix_} void ${iface.name}_release(${getType(iface.name,true)} pThis);\n`
		ret += "\n";
	}
	return ret;	
}



//duk_get_xxx
function dukGetValue(t, index){
	var lt = t.toLowerCase();
	if(lt == "string"){
		return `duk_to_string(ctx, ${index})`;
	}	
	if(lt == "intptr" || lt == "pointer"){
		return `duk_get_pointer(ctx, ${index})`;
	}
	if(intTypes_[lt]){
		return `(${t})duk_get_int(ctx, ${index})`;
	}
	if(boolTypes_[lt]){
		return `(duk_get_boolean(ctx, ${index})?true:false)`;
	}	
	if(realTypes_[lt]){
		return `(${t})duk_get_number(ctx, ${index})`;
	}
	if(lt!="buffer"){
		unknownTypes_[t] = t+"Ptr";
	}
	return `duktape_get_${t}(ctx, ${index})`;
}

//duk_push_xxx
function dukPushValue(t, val, isarg){
	var lt = t.toLowerCase();
	if(lt == "string"){
		if(isarg)return `duk_push_string(ctx, ${val})`;
		return `duk_push_string(ctx, ${val}.c_str())`;
	}	
	if(lt == "intptr" || lt == "pointer"){
		return `duk_push_pointer(ctx, ${val})`;
	}
	if(intTypes_[lt]){
		return `duk_push_int(ctx, (duk_int_t)${val})`;
	}
	if(boolTypes_[lt]){
		return `duk_push_boolean(ctx, (${val}?1:0))`;
	}	
	if(realTypes_[lt]){
		return `duk_push_number(ctx, (duk_double_t)${val})`;
	}
	if(lt!="buffer"){
		unknownTypes_[t] = t+"Ptr";
	}
	return `duktape_push_${t}(ctx, ${val})`;
}

//duk函数中获取this
function dukGetThis(typestr){	
	var ret = "";
	ret += "    duk_push_this(ctx);\n";
	ret += '    duk_get_prop_string(ctx, -1, "\\xff""\\xff""data");\n';
	ret += `    ${getType(typestr)} pThis = (${getType(typestr)})(duk_get_pointer(ctx, -1));\n`
	ret += "    duk_pop(ctx);\n";
	return ret;
}

//一个结构体的转换封装
function convertDukStruct(iface){
	var pushprops = "";
	var getprops = "";
	for(var i=0;i<iface.attributes.length; i++){
		var attr = iface.attributes[i];		
		pushprops += `    ${dukPushValue(attr.type, "arg->" + attr.name)};\n`;
        pushprops += `    duk_put_prop_string(ctx, idx, "${attr.name}");\n`;
		
		getprops += `        if (strcmp(key, "${attr.name}") == 0) {\n`;
		getprops += `            result->${attr.name} = ${dukGetValue(attr.type, "-1")};\n`;
		getprops += `        }else\n`;
	}	

	var ret = "";
	ret += "// function decl \n"
	ret += `void duktape_push_${iface.name}(duk_context* ctx, ${getType(iface.name, true)});\n`;
	ret += `${getType(iface.name)} duktape_get_${iface.name}(duk_context* ctx, int index);\n`;
	ret += `#define duktape_init_${iface.name}(ctx)\n\n`;
	
	ret += ("void duktape_push_" + iface.name + "(duk_context* ctx, "+ getType(iface.name, true) + " arg){\n");
	ret += "    duk_idx_t idx = duk_push_object(ctx);\n";	
	ret += pushprops;
	ret += "}\n";
	ret += "\n";
	ret += (getType(iface.name)+" duktape_get_"+iface.name+"(duk_context* ctx, int index){\n");
	ret += `    auto result = std::make_shared<${iface.name}>();\n`
	ret += ("    const char* key;\n");
	ret += ("    duk_enum(ctx, index, 0);\n");
	ret += ("    while (duk_next(ctx, -1, 1)) {\n");
	ret += ("	     key = duk_to_string(ctx, -2);\n");
	ret += getprops;	
	ret += ("	     { }\n");		
	ret += ("	     duk_pop_2(ctx);\n");
	ret += ("    }\n");
	ret += ("    duk_pop(ctx);\n");
	ret += ("    return result;\n");
	ret += "}\n";
	ret += "\n";
	
	return ret;		
}


//Callback参数的转换
function convertDukCallback(t, i){
	//console.log("callback" + t);
	var index1 = t.indexOf("<");
	var index2 = t.indexOf(">");
	var argtypestr = "";
	if(index1>0 && index2>index1){
		argtypestr = t.substr(index1+1, index2 - index1-1);
	}	
	var argtypes = argtypestr.split(",");
	var argcount = argtypes.length;
	if(argtypestr.length==0)argcount = 0;
		
	var args = "";
	var pushargs = "";
	for(var j=0;j<argcount;j++)	{
		if(j>0)args += ", ";
		args += getType(argtypes[j],true);
		args += " a";
		args += j;
		
		pushargs += `            ${dukPushValue(argtypes[j], "a"+j, true)};\n`;
	}
		
	var ret = "";
	ret += `    ${getCallbackType(t)} arg${i};\n`;
	ret += `    if(duk_is_function(ctx, ${i})){\n`;
	ret += `        auto ref${i} = std::make_shared<${globalRefClass_}>(ctx, ${i});\n`;
	ret += `        arg${i} = [=](${args}){\n`;
	ret += `            ref${i}->push();\n`;
	ret += pushargs;
	ret += `            ref${i}->invoke(${argcount});\n`;
	ret += `        };\n`;
	ret += `    };\n`;
	return ret;
}


//单个函数的duk封装实现 得到一个函数
function convertDukOperation(iface, func){
	var name = iface.name + "_" + func.name;
	
	var hasarg = false;
	var getargs = ""; 
	var args = "";
	var getthisarg = "";
	if(!func.isStatic){
		getthisarg = dukGetThis(iface.name);
		args += "pThis";
		hasarg = true;
	}
	for(var i=0;i<func.arguments.length;i++){
		var arg = func.arguments[i];
		if(arg.type.indexOf(callbackName_)==0){ //callback参数特殊转换
			getargs += convertDukCallback(arg.type, i);
		}else{ //普通参数
			getargs += `    auto arg${i} = ${dukGetValue(arg.type, i)};\n`;
		}
		if(hasarg){
			args += ",";
		}
		args += `arg${i}`;
		hasarg = true;
	}
	
	var retarg = "";
	var pushret = "";
	if(func.type != "void"){
		retarg = "auto ret = ";
		pushret += "    ";
		pushret += dukPushValue(func.type, "ret");
		pushret += ";\n";
		pushret += "    return 1;\n";
	}else{
		pushret += "    return 0;\n";
	}
	
	var ret = "";
	ret += `static int js_${name}(duk_context* ctx){\n`;
	ret += getargs;
	ret += getthisarg;
	ret += `    ${retarg}${name}(${args});\n`;
	ret += pushret;
	ret += "}\n\n";
	return ret;
}


//虚拟属性duk封装实现 得到两个函数
function convertDukAttribute(iface, attr){
	var getname = iface.name + "_get_" + attr.name;
	var setname = iface.name + "_set_" + attr.name;
    
	var getthisarg = "";
	var thisarg = "";
	var thisarg2 = "";
	if(!attr.isStatic){
		getthisarg = dukGetThis(iface.name);
		thisarg = "pThis";
		thisarg2 = "pThis,";
	}
	
	var ret = "";
	if(!attr.isWriteonly){ //有getter
		ret += `static int js_${getname}(duk_context* ctx){\n`;
		ret += getthisarg;
		ret += `    auto ret = ${getname}(${thisarg});\n`;
		ret += `    ${dukPushValue(attr.type, "ret")};\n`;
		ret += `    return 1;\n`;		
		ret += `}\n`;
	}	
	if(!attr.isReadonly){  //有setter
		ret += `static int js_${setname}(duk_context* ctx){\n`;
		if(attr.type.indexOf(callbackName_)==0){ //callback参数特殊转换
			ret += convertDukCallback(attr.type, 0);
		}else{ //普通参数			
			ret += `    auto arg0 = ${dukGetValue(attr.type, 0)};\n`;
		}		
		ret += getthisarg
		ret += `    ${setname}(${thisarg2} arg0);\n`;
		ret += `    return 0;\n`;
		ret += `}\n`;
	}	
	ret += "\n";
	return ret;
}

//转换一个常量
function convertDukRegConstant(iface, cons){
	var name = '"'+cons.name+'"';
	var ret = "";
	ret += `    ${dukPushValue(cons.type, cons.value)};\n`;
	ret += `    duk_put_prop_string(ctx, -2, "${cons.name}");\n`;
	return ret;
}

//duk注册一个属性到对象
function convertDukRegAttribute(iface, attr){
	var getname = iface.name + "_get_" + attr.name;
	var setname = iface.name + "_set_" + attr.name;	
	
	var flags = "";
	var idx = "-3";
	if(attr.isWriteonly){
		flags = "DUK_DEFPROP_HAVE_SETTER";		
	}else if(attr.isReadonly){
		flags = "DUK_DEFPROP_HAVE_GETTER|DUK_DEFPROP_HAVE_ENUMERABLE|DUK_DEFPROP_ENUMERABLE";
	}else{
		flags = "DUK_DEFPROP_HAVE_SETTER|DUK_DEFPROP_HAVE_GETTER|DUK_DEFPROP_HAVE_ENUMERABLE|DUK_DEFPROP_ENUMERABLE";
		idx = "-4";
	}
	
	var ret = "";
	ret += `    duk_push_string(ctx, "${attr.name}");\n`;
	if(!attr.isWriteonly){
		ret += `    duk_push_c_function(ctx, js_${getname}, 0);\n`;
	}
	if(!attr.isReadonly){
		ret += `    duk_push_c_function(ctx, js_${setname}, 1);\n`;
	}	
	ret += `    duk_def_prop(ctx, ${idx}, ${flags});\n`;
	return ret;
}

//duk注册一个函数到对象
function convertDukRegOperation(iface, func){
	var name = iface.name + "_" + func.name;
	
	var ret = "";
	ret += `    duk_push_c_function(ctx, js_${name}, ${func.arguments.length});\n`;
	ret += `    duk_put_prop_string(ctx, -2, "${func.name}");\n`;
	return ret;	
}

//全局对象别名
function getGlobalAlias(iface){
	if(iface.extended){
		var i1 = iface.extended.indexOf("alias(");		
		var i2 = iface.extended.indexOf(")", i1);
		if(i1>=0 && i2>=0){
			return iface.extended.substring(i1+6, i2);
		}
	}
	return iface.name;	
}


function convertDukInterface(iface){
	
	var funcs = ""; //函数实现
	var attrs = ""; //虚拟属性实现
	var regfuncs = ""; //注册静态函数(关联到类)
	var regattrs = "";	//注册静态属性(关联到类)
	var regconsts = ""; //注册常量(关联到类)
	var regmemberfuncs = ""; //注册成员函数(关联到对象)
	var regmemberattrs = ""; //注册成员属性(关联到对象) 
	
	var hasnostatic = false; //有非静态成员
	var contrustorfunc = null; //构造函数
	var exportDefault = false; //导出默认
	
	if(iface.extended.indexOf("default")>=0){
		exportDefault = true;
	}
	
	//遍历处理常量
	for(var i=0;i<iface.constants.length; i++){
		var cont = iface.constants[i]; 
		regconsts += convertDukRegConstant(iface, cont);		
	}	
	//遍历处理属性
	for(var i=0;i<iface.attributes.length; i++){
		var attr = iface.attributes[i]; 
		attrs += convertDukAttribute(iface, attr);
		
		if(attr.isStatic){
			regattrs += convertDukRegAttribute(iface, attr);			
		}else{
			regmemberattrs += convertDukRegAttribute(iface, attr);
			hasnostatic = true;
		}
	}
	//遍历处理函数
	for(var i=0;i<iface.operations.length; i++){
		var func = iface.operations[i]; 
		funcs += convertDukOperation(iface, func);
		
		if(func.isStatic){
			regfuncs += convertDukRegOperation(iface, func);			
		}else{
			regmemberfuncs += convertDukRegOperation(iface, func);
			hasnostatic = true;
		}
		
		if(func.isStatic && func.extended.indexOf("constructor")>=0){
			contrustorfunc = func;
		}
	}
	
	// 整个内容的实现
	var ret = "";
	ret += "// function decl \n"
	if(hasnostatic){
		ret += `void duktape_push_${iface.name}(duk_context* ctx, ${getType(iface.name, true)});\n`;
		ret += `${getType(iface.name)} duktape_get_${iface.name}(duk_context* ctx, int index);\n`;
	}
	ret += `void duktape_init_${iface.name}(duk_context* ctx);\n`;
	
	ret += "// virtual properties \n"
	ret += attrs;	
	ret += "\n";
	ret += "// member functions \n"
	ret += funcs;
	ret += "\n";
	
	if(hasnostatic){ //非静态的，需要push 和 get 对象
	    //析构函数实现
	    if(isDestructible(iface)){
			ret += `// destructor \n`;
			ret += `static int js_${iface.name}_release(duk_context* ctx){\n`;
			ret += `    auto pThis = duktape_get_${iface.name}(ctx, 0);\n`;
			ret += `    ${iface.name}_release(pThis);\n`;
			ret += `    return 0;\n`;
			ret += `}\n\n`;			
		}
	
		//设置对象prop
		ret += `// set/push/get object \n`;
		
		ret += `void duktape_put_props_${iface.name}(duk_context* ctx, ${getType(iface.name, true)} arg){\n`;
		ret += `    duk_push_pointer(ctx, arg);\n`;
		ret += `    duk_put_prop_string(ctx, -2, "\\xff""\\xff""data");\n`;
		ret += regmemberattrs;
		ret += regmemberfuncs;
		ret += `}\n\n`;
		
	    //push对象
		ret += `void duktape_push_${iface.name}(duk_context* ctx, ${getType(iface.name, true)} arg){\n`;
		ret += `    if (!arg){ duk_push_null(ctx); return; }\n`;
		ret += `    duk_push_object(ctx);\n`;
		ret += `    duktape_put_props_${iface.name}(ctx,arg);\n`;
		if(isDestructible(iface)){
			ret += `    duk_push_c_function(ctx, js_${iface.name}_release, 1);\n`;
			ret += `    duk_set_finalizer(ctx, -2);\n`;
		}		
		ret += `}\n\n`;
	
		//get对象
		ret += `${getType(iface.name)} duktape_get_${iface.name}(duk_context* ctx, int index){\n`;
		ret += `    duk_get_prop_string(ctx, index, "\\xff""\\xff""data");\n`;
		ret += `    ${getType(iface.name)} pobj = (${getType(iface.name)})(duk_to_pointer(ctx, -1));\n`
		ret += `    return pobj;\n`;
		ret += `}\n\n`;

	}
	
	ret += `// init api \n`;
	ret += `void duktape_init_${iface.name}(duk_context* ctx){\n`;
	if(!exportDefault){
		if(contrustorfunc){	 //有构造函数	
			ret += `    duk_push_c_function(ctx, js_${iface.name}_${contrustorfunc.name}, ${contrustorfunc.arguments.length});\n`;
		}else{ //无构造函数
			ret += `    duk_push_object(ctx);\n`;
		}
	}
	ret += regattrs;
	ret += regfuncs;	
	ret += regconsts;
	if(!exportDefault){
		ret += `    duk_put_prop_string(ctx, -2, "${getGlobalAlias(iface)}");\n`;
	}
	ret += `}\n\n`;
	return ret;			
}

function convertCXXObject(iface){
	if(iface.type == "struct"){		
		return convertCXXStruct(iface);
	}else{
		return convertCXXInterface(iface);		
	}	
}

function convertDukObject(iface){
	if(iface.type == "struct"){		
		return convertDukStruct(iface);
	}else{
		return convertDukInterface(iface);		
	}	
}

//获取使用过的未知类型()
exports.getUnknownTypes = getUnknownTypes; 
exports.clearUnknownTypes = clearUnknownTypes; 

//获取idl类型对应的c++类型（类型，是否函数参数）
exports.getType = getType;

//获取某类型默认值(类型)
exports.getDefaultValue = getDefaultValue;


exports.convertCXXObject = convertCXXObject;

exports.convertDukObject = convertDukObject;


