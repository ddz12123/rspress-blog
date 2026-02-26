# fastapi 修改默认swagger源

默认swagger源在国内访问不太友好，建议修改为国内源。

> 解决方案：
> - 使用 fastapi-cdn-host 包自动选择最快的 CDN
> - 支持多个国内 CDN 源，自动测速选择最快的

## 1、安装依赖

```shell
pip install fastapi-cdn-host
```

## 2、基本用法（推荐）

```python
from fastapi import FastAPI
from fastapi_cdn_host import monkey_patch_for_docs_ui

app = FastAPI(
    title="我的 API 项目",
    description="使用 fastapi-cdn-host 加速 Swagger UI",
    version="1.0.0"
)

# 🚀 核心步骤：应用补丁
# 这行代码会自动拦截 /docs 和 /redoc 的请求，替换资源链接
monkey_patch_for_docs_ui(app)

@app.get("/")
async def root():
    return {"message": "Swagger UI 已加速！"}

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}

if __name__ == "__main__":
    import uvicorn
    # 启动后访问 http://127.0.0.1:8000/docs 即可看到效果
    uvicorn.run(app, host="0.0.0.0", port=8000)
```