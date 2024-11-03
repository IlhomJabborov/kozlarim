from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import shutil
import os
from model import MyModel

app = FastAPI()

# Initialize MyModel
model = MyModel(model_name="my_model")

@app.post("/generate")
async def generate_caption(image: UploadFile = File(...)):
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid image format. Only JPEG and PNG are supported.")

    try:
        # Save the uploaded image temporarily
        image_path = f"temp_{image.filename}"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Generate caption
        caption = model.generate(image_path=image_path)
        
        # Remove the temporary image file after processing
        os.remove(image_path)

        # Return the generated caption as a JSON response
        return JSONResponse(content={"caption": caption})

    except Exception as e:
        # Cleanup and return an error message
        if os.path.exists(image_path):
            os.remove(image_path)
        raise HTTPException(status_code=500, detail=str(e))
