from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="screen-analysis",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A dual-backend screen analysis application",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/screen-analysis",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    include_package_data=True,
    install_requires=open("requirements.txt").read().splitlines(),
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Operating System :: OS Independent",
    ],
    entry_points={
        "console_scripts": [
            "screen-analysis=server:main",
        ],
    },
)
