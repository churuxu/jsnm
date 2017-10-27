
#include "pch.h"
#include "gen/Foo.h"
#include "gen/Bar.h"
#include "gen/Static.h"
#include "gen/FooBinding.hpp"
#include "gen/BarBinding.hpp"
#include "gen/StaticBinding.hpp"
#include "gen/module_entry.h"

#pragma comment(lib,"../deps/duktape.lib")

typedef void (*logfunc)(const char* msg);
static logfunc LOG_;
#define LOG(msg) if(LOG_)LOG_(msg)


void* module_init(module_get_prop_function func){
	if (func) {
		LOG_ = (logfunc)func("logger_function");
	}
	return NULL;
}

duk_ret_t dukopen_example(duk_context* ctx) {
	LOG("dukopen_example");
	duk_push_object(ctx);
	duktape_init_Foo(ctx);
	duktape_init_Bar(ctx);
	duktape_init_Static(ctx);
	return 1;
}



