Title: Windows下使用pthreads库   
Date: 2017-01-04           
Category: 编程语言      
Tags: 学习笔记 


**环境搭建**

1. 下载phtreads库： ftp://sourceware.org/pub/pthreads-win32/pthreads-w32-2-9-1-release.zip
2. 使用`Pre-built.2/include`作为头文件引用
3. 使用`Pre-built.2/lib/x86/pthreadVC2.lib`做为库文件引用
4. 将`Pre-built.2/dll/x86/pthreadVC2.dll`考到生成exe的目录

**测试代码：**

```cpp
#include "pthread.h"
#include <iostream>
using namespace std;

void* Function_t(void* Param)  
{  
	pthread_t myid = pthread_self();  
	cout << "线程ID:" << myid.x << endl;  
	return NULL;  
} 

int test_interface(int argc, char ** argv)
{
	pthread_t pid;  
	pthread_attr_t attr;  
	pthread_attr_init(&attr);  
	pthread_attr_setscope(&attr, PTHREAD_SCOPE_PROCESS);  
	pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED); 

	cout << "创建线程" << endl;
	pthread_create(&pid, &attr, Function_t, NULL);  
	
	getchar();  
	pthread_attr_destroy(&attr);  
	return 0;  
}
```