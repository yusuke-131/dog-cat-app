from PIL import Image
from pathlib import Path
import torch
from torchvision import models, transforms

# モデル読み込み
model = models.resnet50(weights=None)
model.fc = torch.nn.Linear(model.fc.in_features, 2)
model.load_state_dict(torch.load("api/image_model.pth", map_location="cpu"))
model.eval()

# 画像前処理用
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

async def classify_image(file_path: str):
    file_path = Path(file_path).as_posix()
    image = Image.open(file_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.softmax(output, dim=1)[0]

    predicted_class = "猫" if probs[0] > probs[1] else "犬"
    return {
        "labels": ["猫", "犬"],
        "scores": probs.tolist(),
        "predicted_class": predicted_class
    }
