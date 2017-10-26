
#include "pch.h"
#include "gen/Bar.h"

class Bar {
	std::string name_;
public:
	Bar(const char* name) {
		name_ = name;
		printf("%s(%s)\n", __FUNCTION__, name);
	}
	~Bar() {
		printf("%s\n", __FUNCTION__);
	}
	void sayGoodBye() {
		printf("good bye, %s\n", name_.c_str());
	}
};


BarPtr Bar_create(const char* name) {
	return new Bar(name);
}

void Bar_sayGoodBye(BarPtr pThis) {
	pThis->sayGoodBye();
}


// destructor 
void Bar_release(BarPtr pThis) {
	delete pThis;
}



