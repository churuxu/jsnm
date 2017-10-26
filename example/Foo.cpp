
#include "pch.h"
#include "gen/Foo.h"

class Foo {
	std::string name_;
public:
	Foo(const char* name) {
		name_ = name;
		printf("%s(%s)\n", __FUNCTION__, name);
	}
	~Foo() {
		printf("%s\n", __FUNCTION__);
	}
	void sayHello() {
		printf("hello, %s\n", name_.c_str());
	}
};


FooPtr Foo_create(const char* name) {
	return new Foo(name);
}

void Foo_sayHello(FooPtr pThis) {
	pThis->sayHello();
}


// destructor 
void Foo_release(FooPtr pThis) {
	delete pThis;
}


