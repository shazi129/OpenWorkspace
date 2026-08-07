Title: Unity下C#与Java的交互(一)
Date: 2017-10-27
Category: 编程语言
Tags: Unity


[TOC]


这种情况主要发生在Unity要使用Android代码的情况下。Unity提供的方式是将用到的Android代码打成jar文件，放到Unity的plugins文件中，然后使用。

![Alt text](./1509070611569.png)

示例用到的是utils.jar


##1. 创建Android工程

创建一个Android工程，并导入Unity提供的jar，下面是我的示例：

![Alt text](./1509070478123.png)

其中，`com.zw.utils`是要导出的包，`com.zw.unity_test`是我用来测试jar包的代码，class.jar是导入的unity提供的jar包。

##2. 编写java代码并导出

这里先实现一个小功能：

```java
public class Utils {
	public static int addOne(int a){
    	return a+1;
    }
}
```
右击`com.zw.utils`导出jar：

![Alt text](./1509071051400.png)

并将utils.jar放到Unity的 **Asset/Plugins/Android/bin** 目录下

##3. 编写C#代码

```java
public class TestAndroid : MonoBehaviour {

    private Button selfBtn;
    public Text selfText;
    public Text outText;
    private int a = 0;

	// Use this for initialization
	void Start ()
    {
        selfBtn = gameObject.GetComponent<Button>();
        selfBtn.onClick.AddListener(onSelfBtnClick);
    }

    private void onSelfBtnClick()
    {
        try
        {
#if UNITY_ANDROID
            AndroidJavaClass jClass = new AndroidJavaClass("com.zw.utils.Utils");
            a = jClass.CallStatic<int>("addOne", a);
#endif
            selfText.text = "" + a;
        }
        catch(Exception e)
        {
            outText.text = e.ToString();
        }
    }
}
```
Unity界面

![Alt text](./1509071407810.png)

button上的text显示java代码返回的结果，另一个text显示错误信息。

##打Android包运行

###更改AndroidManifest

当我们在android中加入了一些需要权限的代码，例如读取sd卡数据。有两种方法，一是在Unity的Player Setting中设置这个：

![Alt text](./1509701336890.png)

二是更改AndroidManifest.xml

Unity在打apk包时，会以：

![Alt text](./1509701445692.png)

为模版来修改，那我们要做的，就是将这个xml复制到**Asset/Plugins/Android/**下，然后加入权限申明就可以了。

其他略





