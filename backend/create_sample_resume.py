import fitz

def generate_pdf():
    print("Creating PDF document...")
    doc = fitz.open()
    page = doc.new_page()
    
    text = (
        "John Doe\n"
        "Backend Engineer\n\n"
        "Skills:\n"
        "Python, Go, SQL, Docker, Redis\n\n"
        "Experience:\n"
        "- Software Engineer at TechCorp (2023-Present)\n"
        "  Designed database schemas and built microservices in Python.\n\n"
        "Projects:\n"
        "- Distributed Task Queue: built with Redis and Go\n"
        "  Achieved high throughput.\n\n"
        "Education:\n"
        "- BS in Computer Science, State University"
    )
    
    page.insert_text(
        (50, 50),
        text,
        fontsize=11
    )
    
    doc.save("sample_resume.pdf")
    doc.close()
    print("PDF saved as sample_resume.pdf successfully.")

if __name__ == "__main__":
    generate_pdf()
