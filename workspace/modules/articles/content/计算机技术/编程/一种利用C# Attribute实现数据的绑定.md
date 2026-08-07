Title: 一种利用C# Attribute实现数据的绑定
Date: 2018-05-15           
Category: 编程语言      
Tags: 学习笔记 

#一种利用C# Attribute实现数据的绑定

在日常开发中，经常会有数据和UI绑定的需求，即数据发生改变时，UI要随之改变。这里提供一个简单的思路，目的是尽量减少代码的编写。

ModelBase 数据存储基类
```csharp
using System.Collections;
using System;
using System.Reflection;
using System.Collections.Generic;

[AttributeUsage(AttributeTargets.Property, Inherited = false)]
public class ObservableName : Attribute
{
    public string name = String.Empty;

    public ObservableName(string bindName)
    {
        name = bindName;
    }
}

public class ModelBase
{
    public class ModelBindingInfo
    {
        public PropertyInfo propertyInfo = null;
        public ArrayList callbacks = new ArrayList();
    }

    private Dictionary<string, ModelBase.ModelBindingInfo> _bindingTable = new Dictionary<string, ModelBase.ModelBindingInfo>();

    public ModelBase()
    {
        collectObservableProperty();
    }

    private void collectObservableProperty()
    {
        _bindingTable.Clear();

        Type type = this.GetType();
        PropertyInfo[] propertyInfos = type.GetProperties();
        for (int i = 0; i < propertyInfos.Length; i++)
        {
            object[] obs = propertyInfos[i].GetCustomAttributes(false);
            for (int j = 0; j < obs.Length; j++)
            {
                ObservableName obName = obs[j] as ObservableName;
                if (obName != null && !_bindingTable.ContainsKey(obName.name))
                {
                    ModelBase.ModelBindingInfo bindingInfo = new ModelBase.ModelBindingInfo();
                    bindingInfo.propertyInfo = propertyInfos[i];
                    _bindingTable[obName.name] = bindingInfo;
                }
            }
        }
    }

    public void addObserverBinding<T>(string obName, Action<T> cb)
    {
        if (_bindingTable.ContainsKey(obName))
        {
            _bindingTable[obName].callbacks.Add(cb);
        }
    }

    public void removeObserverBinding<T>(string obName, Action<T> cb)
    {
        if (_bindingTable.ContainsKey(obName))
        {
            ArrayList callbacks = _bindingTable[obName].callbacks;
            callbacks.Remove(cb);
        }
    }

    public void setObservableData<T>(string obName, T data)
    {
        if (!_bindingTable.ContainsKey(obName))
        {
            return;
        }

        ModelBindingInfo bindingInfo = _bindingTable[obName];
        bindingInfo.propertyInfo.SetValue(this, data, null);

        T newData = (T)bindingInfo.propertyInfo.GetValue(this, null);

        //通知
        ArrayList callbacks = _bindingTable[obName].callbacks;
        for (int j = 0; j < callbacks.Count; j++)
        {
            Action<T> cb = (Action<T>)callbacks[j];
            cb(newData);
        }
    }
}
```

使用：
如果model中的某个property要被绑定，那么就加上`ObservableName`的属性，指定绑定的key， 然后就可以通过`addObserverBinding`来绑定行为了。

```csharp
	class Person: ModelBase
    {
        [ObservableName("address")]
        public string address { get; set; }
    }

    class Test
    {
        public void testAttribute()
        {
            Person zhangwen = new Person();
            zhangwen.addObserverBinding<string>("address", onZhangwenAddrChange);

            Person shazi = new Person();
            shazi.addObserverBinding<string>("address", onShaziAddrChange);

            zhangwen.setObservableData("address", "caifugang");
            shazi.setObservableData("address", "baijin");
        }

        private void onShaziAddrChange(string obj)
        {
            Console.WriteLine("shazi's addr changed, new addr: " + obj);
        }

        private void onZhangwenAddrChange(string obj)
        {
            Console.WriteLine("zhangwen's addr changed, new addr: " + obj);
        }
        
		static void Main(string[] args)
        {
            TestAttribute test = new TestAttribute();
            test.testAttribute();
            Console.ReadKey();
        }
    }
```