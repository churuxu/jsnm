#pragma once

#include <string>
#include <memory>
#include <functional>

//must include "duktake.h" befor




typedef std::string Buffer;


extern void duktape_handle_error(duk_context* ctx, const char* msg);

static Buffer duktape_get_Buffer(duk_context* ctx, int index) {
	Buffer result;
	if (duk_is_string(ctx, index)) {
		const char* data = duk_get_string(ctx, index);
		result = data;
	}
	else {
		duk_size_t sz = 0;
		void* c = duk_get_buffer_data(ctx, index, &sz);
		if (c && sz) {
			result.assign((char*)c, sz);
		}
	}
	return result;
}

static void duktape_push_Buffer(duk_context* ctx, const Buffer& data) {
	void* ptr = duk_push_buffer(ctx, data.length(), 0);
	if (ptr) {
		memcpy(ptr, data.data(), data.length());
	}	
}

class  DukGlobalRef :public std::enable_shared_from_this<DukGlobalRef>{
protected:
	duk_context* ctx_;

	void getUniqueKey(char* buf, int buflen) {
		snprintf(buf, buflen, "_ref_%p", this);
	}
public:
	DukGlobalRef(duk_context* ctx, int index) {
		//OutputDebugStringA("DuktapGlobalRef()\n");
		char key[64];
		getUniqueKey(key, 64);
		ctx_ = ctx;
		duk_push_global_object(ctx);
		duk_dup(ctx, index);
		duk_put_prop_string(ctx, -2, key);
		duk_pop(ctx);
	}
	~DukGlobalRef() {
		//OutputDebugStringA("~DuktapGlobalRef()\n");
		char key[64];
		getUniqueKey(key, 64);
		duk_push_global_object(ctx_);
		duk_del_prop_string(ctx_, -1, key);
		duk_pop(ctx_);
	}
	//-1 = object  -2 = global
	void push() {
		char key[64];
		getUniqueKey(key, 64);
		//duk_push_global_object(ctx_);		
		duk_get_global_string(ctx_, key);
	}

	void invoke(int argcount) {
		auto sh = shared_from_this();
		int ret = duk_pcall(ctx_, argcount); //may delete ref of this
		if(ret){
			if (duk_is_error(ctx_, -1)) {
				duk_get_prop_string(ctx_, -1, "stack");
				const char* errmsg = duk_safe_to_string(ctx_, -1);
				duktape_handle_error(ctx_, errmsg);
		
				duk_pop(ctx_);
				duk_pop(ctx_);
			}
			else {
				const char* errmsg = duk_safe_to_string(ctx_, -1);
				duktape_handle_error(ctx_, errmsg);				
				duk_pop(ctx_);
			}						
		}
		duk_pop(ctx_);
	}

	duk_context* ctx() { return ctx_; }
};


