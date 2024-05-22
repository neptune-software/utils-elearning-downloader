import sys
import os
import moviepy.editor as mp
import speech_recognition as sr

def transcribe_video(video_path):
    # 提取文件名
    file_name = os.path.splitext(os.path.basename(video_path))[0]
    audio_path = f"./data/{file_name}_audio.wav"

    # 提取音频
    video = mp.VideoFileClip(video_path)
    audio = video.audio
    audio.write_audiofile(audio_path)

    # 使用speech_recognition进行语音识别
    recognizer = sr.Recognizer()
    audio_file = sr.AudioFile(audio_path)

    with audio_file as source:
        audio_data = recognizer.record(source)
        text = recognizer.recognize_google(audio_data)
    
    # Write the result into a text file
    with open(f"./data/{file_name}.txt", "w") as f:
        f.write(text)

    return

if __name__ == "__main__":
    video_path = sys.argv[1]
    transcribe_video(video_path)
