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
# video1 =  '20240925_154709_761.webm'
# video2 = '20240925_155859_813.webm'
# output_video = 'merged_video5.mp4'

# arr  = [video1, video2]
# combine_videos(arr, output_video)
