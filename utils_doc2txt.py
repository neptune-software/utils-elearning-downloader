import os
import argparse
from docx import Document

def check_and_create_directory(directory_name):
    if not os.path.exists(directory_name):
        os.makedirs(directory_name)
        print(f"Directory '{directory_name}' created successfully.")
    else:
        print(f"Directory '{directory_name}' already exists.")

def convert_docx_to_txt(docx_file, txt_file):
    doc = Document(docx_file)
    print(f"Processing file: {docx_file}")
    with open(txt_file, "w", encoding="utf-8") as f:
        for paragraph in doc.paragraphs:
            f.write(paragraph.text + "\n")
    print(f"Converted '{docx_file}' to '{txt_file}'")

def process_folder(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".docx"):
                docx_file = os.path.join(root, file)
                doc_name = os.path.splitext(file)[0]
                parent_folder_name = os.path.basename(root)
                txt_file = os.path.join("data_ingested", f"doc_{parent_folder_name}_{doc_name}.txt")
                convert_docx_to_txt(docx_file, txt_file)

def main():
    parser = argparse.ArgumentParser(description="Convert DOCX files to TXT files in a specified folder.")
    parser.add_argument("folder_path", help="The path to the folder to scan for DOCX files.")
    
    args = parser.parse_args()
    
    folder_path = args.folder_path
    
    check_and_create_directory("data_ingested")
    process_folder(folder_path)

if __name__ == "__main__":
    main()
