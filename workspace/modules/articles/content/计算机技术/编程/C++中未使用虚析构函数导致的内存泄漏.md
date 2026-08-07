Title: C++中未使用虚析构函数导致的内存泄漏
Date: 2017-04-06
Category: 编程语言
Tags: C++


代码

```cpp
#include <vector>
#include <iostream>
#include "vld.h"

using namespace std;

class Base
{
public:
	Base(){}
	~Base()
	{
		cout << "Base Destructor" << endl;
	}
};

class Derive : public Base
{
public:
	Derive()
	{
		vecInt.push_back(0);
		vecInt.push_back(2);
	}
	~Derive()
	{
		cout << "Derive Destructor" << endl;
	}

	vector<int> vecInt;
};

int main(int argc, char ** argv)
{
	Base * a = new Derive();
	delete a;
	return 0;
}
```

vld内存检查：

 > Leak Hash: 0xFF7D4793, Count: 1, Total 8 bytes
  Call Stack (TID 7516):
    MSVCR100D.dll!operator new()
    e:\program files (x86)\microsoft visual studio 10.0\vc\include\xmemory (36): TestPrj.exe!std::_Allocate<std::_Container_proxy>() + 0x15 bytes
    e:\program files (x86)\microsoft visual studio 10.0\vc\include\xmemory (187): TestPrj.exe!std::allocator<std::_Container_proxy>::allocate() + 0xB bytes
    e:\program files (x86)\microsoft visual studio 10.0\vc\include\vector (442): TestPrj.exe!std::_Vector_val<int,std::allocator<int> >::_Vector_val<int,std::allocator<int> >() + 0xA bytes
    e:\program files (x86)\microsoft visual studio 10.0\vc\include\vector (508): TestPrj.exe!std::vector<int,std::allocator<int> >::vector<int,std::allocator<int> >()
    f:\workspace\testprj\testprj\singletest\virtualdestructor.cpp (25): TestPrj.exe!Derive::Derive() + 0x59 bytes
    f:\workspace\testprj\testprj\singletest\virtualdestructor.cpp (40): TestPrj.exe!test_interface() + 0x2B bytes
    f:\workspace\testprj\testprj\main.cpp (6): TestPrj.exe!main() + 0xD bytes
    f:\dd\vctools\crt_bld\self_x86\crt\src\crtexe.c (555): TestPrj.exe!__tmainCRTStartup() + 0x19 bytes
    f:\dd\vctools\crt_bld\self_x86\crt\src\crtexe.c (371): TestPrj.exe!mainCRTStartup()
    kernel32.dll!BaseThreadInitThunk() + 0x12 bytes
    ntdll.dll!RtlInitializeExceptionChain() + 0x63 bytes
    ntdll.dll!RtlInitializeExceptionChain() + 0x36 bytes
  Data:
    D8 4C 48 00    00 00 00 00                                   .LH..... ........

因为基类的析构函数没有加virtual，delete的时候只会释放基类声明的内存块，子类的成员变量占用的内存就忽略了，导致内存泄漏。
