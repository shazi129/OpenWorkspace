Title: glScissor函数       
Date: 2015-11-05           
Category: OpenGL       
Tags: OpenGL          


glScissor函数用来剪裁一个绘制区域，比如只要展示纹理的一部分，示例：

    void myDisplay(void)    
    {   
        glEnable(GL_SCISSOR_TEST);
        glScissor(50, 50, 50, 50);
    
        glClear(GL_COLOR_BUFFER_BIT);    
        glRectf(0, 0, 200, 200);    
        glFlush();    

        glDisable(GL_SCISSOR_TEST);
    }

这里本来要绘制一个(0,0)位置开始宽高都为200的矩形，加上glScissor语句后，只绘制从(50, 50)开始宽高都为50的这部分区域。