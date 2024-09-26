import requests
import os

def download_video(url, folder_path, file_name):
    # Send a request to the URL
    response = requests.get(url, stream=True)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Open a file in the folder to save the video
        #file_path = f"{folder_path}/{file_name}"
        file_path = os.path.join(folder_path, file_name)
        print(file_path)
        with open(file_path, 'wb') as video_file:
            # Write the video content in chunks to avoid memory issues
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    video_file.write(chunk)
        
        print(f"Video saved as {file_path}")
    else:
        print(f"Failed to download video. Status code: {response.status_code}")

# Example usage
video_url = 'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/77c3961b-84db-4ec5-91cc-a679bb6af7fe/transfers/rendered_video.mp4'  # Replace with actual video URL
save_folder = 'video'                      # Replace with your folder path
video_name = 'my_video.mp4'                          # Replace with desired file name

download_video(video_url, save_folder, video_name)
