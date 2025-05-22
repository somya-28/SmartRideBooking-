import subprocess, json

def run_cpp_exec(executable, data):
    process = subprocess.Popen(
        [executable], stdin=subprocess.PIPE, stdout=subprocess.PIPE
    )
    output, _ = process.communicate(input=json.dumps(data).encode())
    return json.loads(output)
