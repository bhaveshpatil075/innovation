import subprocess

def combine_videos(arr, output):
    # Create a temporary text file for input file list
    with open('inputs.txt', 'w') as f:
        for item in arr:
            f.write(f"file 'uploads/{item}'\n")        

    # FFmpeg command to concatenate videos
    command = [
        'ffmpeg',
        '-f', 'concat',
        '-safe', '0',
        '-i', 'inputs.txt',
        '-c', 'copy',
        'uploads/' + output
    ]

    # Run the command
    subprocess.run(command, check=True)

    # Clean up
    import os
    os.remove('inputs.txt')

# Example usage
# video1 = 'my_video.mp4'   # Replace with the first video's path
# video2 = 'my_video2.mp4'   # Replace with the second video's path
# output_video = 'output_merged_video1.mp4'  # Output file path

# arr  = [video1,'20240926_201352_890.mp4', video2, '20240926_201417_658.mp4',]
# combine_videos(arr, output_video)
