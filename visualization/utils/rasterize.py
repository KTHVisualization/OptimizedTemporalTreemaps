import sys
import argparse
import re

def read_file(file_path):
    with open(file_path, 'r') as file:
        return file.read()

def write_file(file_path, content):
    with open(file_path, 'w') as file:
        file.write(content)

def replace_svg_tag(template_content, svg_content):
    return re.sub(r'<svg.*?</svg>', svg_content, template_content, flags=re.DOTALL)

def replace_desired_width(template_content, rasterization_width):
    return re.sub(r'const DesiredWidth = \d+;', f'const DesiredWidth = {rasterization_width};', template_content)

def main():
    # Create argument parser
    parser = argparse.ArgumentParser(description='Rasterize SVG file')
    parser.add_argument('svg_file', help='Path to the SVG file')
    parser.add_argument('rasterization_width', type=int, help='Desired width for rasterization', nargs='?', default=5000)

    # Parse command line arguments
    args = parser.parse_args()

    # Read SVG file
    svg_content = read_file(args.svg_file)

    # Read RasterizeTemplate.html file
    template_file = 'RasterizeTemplate.html'
    template_content = read_file(template_file)

    # Replace SVG tag in template with SVG content
    modified_template_content = replace_svg_tag(template_content, svg_content)

    # Replace desired width in modified template content
    modified_template_content = replace_desired_width(modified_template_content, args.rasterization_width)

    # Save modified template file
    output_file = args.svg_file.replace('.svg', '.html')
    write_file(output_file, modified_template_content)


if __name__ == '__main__':
    main()
