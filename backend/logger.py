from rich.console import Console
from rich.panel import Panel
from rich.text import Text
import torch
try:
    import pynvml
except:
    pynvml = None

console = Console()

def get_real_gpu_info():
    try:
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)

        name = pynvml.nvmlDeviceGetName(handle)
        mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)

        total = mem_info.total / 1e9
        used = mem_info.used / 1e9

        return {
            "name": name.decode() if isinstance(name, bytes) else name,
            "memory": f"{used:.1f}GB / {total:.1f}GB",
            "utilization": f"{util.gpu}%",
        }

    except Exception as e:
        return {
            "name": f"Error: {str(e)}",
            "memory": "Error",
            "utilization": "Error",
        }

def format_line(emoji, label, value):
    return f"{emoji} {label:<14} → {value}"

def log_system_status(nlp_status, clip_status, device):
    """Display system initialization status with colored output"""
    gpu = get_real_gpu_info()
    
    console.print(
        Panel.fit(
            "\n".join([
                "[bold cyan]🚀 WATERGUARD AI SYSTEM INITIALIZED[/bold cyan]\n",
                format_line("🧠", "NLP Model", nlp_status),
                format_line("🖼️", "CLIP Model", clip_status),
                format_line("⚡", "Device", device),
                "",
                "⚡ GPU INFO",
                format_line("  ", "Device", gpu["name"]),
                format_line("  ", "Memory", gpu["memory"]),
                format_line("  ", "Util", gpu["utilization"]),
            ]),
            border_style="cyan"
        )
    )

def success(msg):
    """Print success message in green"""
    console.print(f"[green]✅ {msg}[/green]")

def error(msg):
    """Print error message in red"""
    console.print(f"[red]❌ {msg}[/red]")

def warning(msg):
    """Print warning message in yellow"""
    console.print(f"[yellow]⚠️ {msg}[/yellow]")

def info(msg):
    """Print info message in blue"""
    console.print(f"[blue]ℹ️ {msg}[/blue]")

def step(emoji, msg):
    """Print step message"""
    console.print(f"{emoji} {msg}")

def request_received(text, prediction, risk):
    """Log request details"""
    console.print(
        Panel.fit(
            f"""
[bold blue]📥 New Request Received[/bold blue]

Text Preview → {text[:50]}...
Prediction   → {prediction}
Risk Level   → {risk}
            """,
            border_style="blue"
        )
    )
