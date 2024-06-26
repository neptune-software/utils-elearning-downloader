# Neptune ELearning Contents Downloader

## Introduction
This script utilizes Puppeteer, a Node.js library, to automate web interactions. Specifically, it's designed to download videos and text from a Neptune ELearning webpage (Foundation course as default).

## Installation
To install Puppeteer and its dependencies, follow these steps:

1. Ensure you have Node.js installed on your machine.
2. Run the `npm install` command to install the required dependencies.
3. You may also need to install ffmpeg if it's not already installed on your system. Visit [FFmpeg website](https://ffmpeg.org/download.html) for installation instructions.

To incorporate a Python script for video transcription, here's how to set it up:

1. Make sure you have Python installed on your system.
2. Install the necessary Python packages by running `pip install moviepy SpeechRecognition`.


## Usage
After installation, you can use this script as follows:

- Locate the following sections in the code of `mian_get_sctructure.js` or `mian_get_contents.js`:
```javascript
username: {
    selector: 'input[id="user[email]"]',
    value: 'YOUR_USERNAME_HERE'
},
password: {
    selector: 'input[id="user[password]"]',
    value: 'YOUR_PASSWORD_HERE'
},
```
- Replace 'YOUR_USERNAME_HERE' with your Neptune ELearning username and 'YOUR_PASSWORD_HERE' with your password.
- Save the file.
- Run the `node mian_get_sctructure.js` command to run the script to get the structure information of the course. The results are saved as `open-edition-developer-training-foundation-2024.html`.
- Run the `node mian_get_contents.js` command to run the script to get the text and video contents of the course, saved in the `./data/` folder.

Option: Modify the TARGET object in the code with your specific target URL, login credentials, and button selector.
Option: Uncommenting that code snippet will indeed allow users to observe the script's actions in real-time within the browser window.
```javascript
 //    headless: false,
```

> [!NOTE]  
> Ensure you have the necessary permissions to download eLearning texts and videos from the specified URL.
> Customize the code according to your specific requirements and target website structure.
> By following these steps, you can easily automate the process of downloading videos from web pages using Puppeteer.

> [!NOTE]  
> The documentation and PDF information for the eLearning module are processed separately. Please refer to the `utils_doc2txt.ipynb` file for details. To use the provided script, follow these steps:
1. Download the [Foundation](https://neptunesoftware.sharepoint.com/:f:/r/sites/GTM/Delte%20dokumenter/e-learning/DXP23%20eLearning/Expert?csf=1&web=1&e=duTrHH) folder or the [Advanced](https://neptunesoftware.sharepoint.com/:f:/r/sites/GTM/Delte%20dokumenter/e-learning/DXP23%20eLearning/Advanced?csf=1&web=1&e=OLMEHe) folder from the Product Division OneDrive.
2. Install the necessary Python package:
```sh
pip install python-docx
```
3. Run the conversion script:
```sh
python convert_docx_to_txt.py /path/to/your/folder
```