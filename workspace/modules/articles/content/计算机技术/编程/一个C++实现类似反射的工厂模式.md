Title: 一个C++实现类似反射的工厂模式
Date: 2017-04-19
Category: 编程语言
Tags: C++


@(编程语言)[C/C++]

目的：使用C++实现一个有类似反射功能的工厂类

头文件：
```cpp
#include <iostream>
#include <string>
#include <map>

using namespace std;

class Base
{
public:
	virtual void print() {cout << "this is class Base" << endl;}
};

class DeriveA : public Base
{
public:
	virtual void print() {cout << "this is class DeriveA" << endl;}
};

class DeriveB : public Base
{
public:
	virtual void print() {cout << "this is class DeriveB" << endl;}
};

class Factory
{
public:
	static Factory * shareInstance();
	~Factory();

	template<typename T>
	T* getClass()
	{
		string keyName = string(typeid(T).name());

		map<string, Base*>::iterator iter = mClassMap.find(keyName);
		if (iter != mClassMap.end())
		{
			T *  retObj = dynamic_cast<T*>(iter->second);
			if (retObj)
			{
				return retObj;
			}
		}

		T* retObj = new T();
		addClass(keyName, retObj);
		return retObj;
	}

private:
	Factory();
	void addClass(const string & key, Base * baseClass);

private:
	map<string, Base*> mClassMap;
};
```
源文件
```cpp
Factory::Factory(){}

Factory::~Factory(){}

Factory * Factory::shareInstance()
{
	static Factory factory;
	return &factory;
}

void Factory::addClass(const string & key, Base * baseClass)
{
	map<string, Base*>::iterator iter = mClassMap.find(key);
	if (iter != mClassMap.end())
	{
		delete (iter->second);
		mClassMap.erase(iter);
	}

	mClassMap[key] = baseClass;
}

int main(int argc, char ** argv)
{
	Factory::shareInstance()->getClass<DeriveA>()->print();
	Factory::shareInstance()->getClass<DeriveB>()->print();
	return 0;
}
```
