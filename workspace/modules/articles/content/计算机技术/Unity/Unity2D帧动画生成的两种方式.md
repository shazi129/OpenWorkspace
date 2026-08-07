Title: Unity2D帧动画实现的两种方式    
Date: 2015-09-20 
Category: Unity
Tags: Unity  


在游戏制作过程中，经常用到帧动画，这里介绍两种实现帧动画的方式


## 源材料准备 ##


序列帧所用到的图片：

![image](http://i11.tietuku.com/c42269cb3abd49bf.png)

生成这些序列帧所用到的资源可以参考： <http://www.raywenderlich.com/61532/unity-2d-tutorial-getting-started>


## 1. 脚本方式实现 ##

脚本实现的方式在上面的链接中有介绍，这里把列出源码：


	using UnityEngine;
	using System.Collections;
	
	public class Zombie : MonoBehaviour {
	
		public Sprite[] m_sprits;
		public int m_frameRate;
	
		／／帧率
		float m_frameTime;
		SpriteRenderer m_spriteRenderer;
	
		// Use this for initialization
		void Start () {
		
			m_frameTime = 1.0f / (float)m_frameRate;
			m_spriteRenderer = GetComponent<SpriteRenderer> ();
		}
		
		// Update is called once per frame
		void Update () {
		
			m_frameTime -= Time.deltaTime;
			if (m_frameTime < 0.0f) {
	
				int index = 0;
				for (; index < m_sprits.Length; index ++ ) {
				
					if (m_sprits[index] == m_spriteRenderer.sprite) {
						break;
					}
				}
				index = (index + 1) % m_sprits.Length;
				m_spriteRenderer.sprite = m_sprits[index];
	
				m_frameTime = 1.0f / (float)m_frameRate;
			}
		}
	}


## 2.编辑器实现 ##

帧动画也可以由Unity的动画编辑器来实现，实现方式如下。

###打开动画编辑器 ###

先在场景中以序列帧的第一帧创建一个精灵，选中它，然后通过快捷键Ctrl + 6 或者菜单中的 Window -> Animation打开动画编辑器。在弹出窗口的左上角点击**Add Property**, 会弹出一个让你保存动画的界面，如图：

![image](http://i11.tietuku.com/f2685707fa981717.png)    
输入一个名字将其保存起来。

根据上面程序实现的方法，我们知道绘制精灵是通过SpriteRender来实现的, 所以在动画编辑器中可以增加一个SpriteRender属性：

![image](http://i11.tietuku.com/5d483c4cddef2115.png)

之后就可以将序列帧拖入动画编辑器中：

![image](http://i11.tietuku.com/3797c8d911c3aa84.png)

加好之后，点击左上角的三角符号，就可以发现Unity编辑器中的僵尸动起来了。

 