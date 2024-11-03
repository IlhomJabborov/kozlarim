# from transformers import BlipProcessor, BlipForConditionalGeneration
# from PIL import Image
# import torch

# #gpu ishlatish
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# # print("Device:", device)

# class MyModel:
#     def __init__(self) -> None:
#         pass

#     def generate(image_path:str, m_model:str ="my_model")->str :        
        
#         processor = BlipProcessor.from_pretrained(m_model)
#         model = BlipForConditionalGeneration.from_pretrained(m_model)

#         image_path = image_path
#         image = Image.open(image_path)

#         inputs = processor(image, return_tensors="pt")

#         output = model.generate(**inputs)

#         caption = processor.decode(output[0], skip_special_tokens=True)
#         return caption

from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch

# Initialize GPU usage
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class MyModel:
    def __init__(self, model_name: str = "Salesforce/blip-image-captioning-base"):
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name).to(device)

    def generate(self, image_path: str) -> str:
        # Open image and prepare inputs
        image = Image.open(image_path)
        inputs = self.processor(image, return_tensors="pt").to(device)
        
        # Generate caption
        output = self.model.generate(**inputs)
        caption = self.processor.decode(output[0], skip_special_tokens=True)
        return caption
