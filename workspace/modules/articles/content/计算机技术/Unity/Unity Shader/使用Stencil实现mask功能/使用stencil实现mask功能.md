Title: 使用stencil实现mask功能
Date: 2019-9-24
Category: 计算机图形学
Tags: 学习笔记, Unity, shader



代码

```c

Shader "Custom/StencilMask"
{
    Properties
    {
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
		_StencilRef("StencilRef", Float) = 0
	}

	SubShader
	{
		Tags { "RenderType" = "Transparent" }
		Blend SrcAlpha OneMinusSrcAlpha

		Pass
		{
			Stencil
			{
				Ref[_StencilRef]
				Comp Always
				Pass Replace
			}

			CGPROGRAM

			#pragma vertex vert
			#pragma fragment frag

			#include "Lighting.cginc"

			sampler2D _MainTex;
			float4    _MainTex_ST;

			struct a2v
			{
				float4 vertex: POSITION;
				float4 texcoord: TEXCOORD0;
			};

			struct v2f
			{
				float4 pos: SV_POSITION;
				float2 uv: TEXCOORD0;
			};

			v2f vert(a2v v)
			{
				v2f o;
				o.pos = UnityObjectToClipPos(v.vertex);
				o.uv = TRANSFORM_TEX(v.texcoord, _MainTex);
				return o;
			}

			fixed4 frag(v2f i) : SV_Target
			{
				fixed4 color = tex2D(_MainTex, i.uv).rgba;

				//只有白色部分的stencil有效
				half3 delta = abs(color.rgb - fixed3(0.0, 0.0, 0.0));
				if (length(delta) < 1)
				{
					discard;
				}

				//用于控制是否显示mask图片
				color.a = 0.5;

				return color;
			}

			ENDCG
		}
    }

    FallBack off
}

```

