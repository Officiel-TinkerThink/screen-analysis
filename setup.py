from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="screen-analysis",
    version="0.1.0",
    author="Wahyu Bornok Augus Sinurat",
    author_email="bornouksyn@beaverhand.com",
    description="A screen analysis application",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Officiel-TinkerThink/screen-analysis",
    packages=find_packages(where="screen_analysis"),
    package_dir={"": "screen_analysis"},
    include_package_data=True,
    install_requires=open("requirements.txt").read().splitlines(),
    python_requires=">=3.8",
    extras_require={
        'dev': [
            'pytest>=7.4.0,<8.0.0',
            'pytest-cov>=4.0.0,<5.0.0',
            'black>=23.0.0,<24.0.0',
            'isort>=5.12.0,<6.0.0',
            'mypy>=1.0.0,<2.0.0',
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
)
