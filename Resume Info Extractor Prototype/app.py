import streamlit as st
import fitz
import spacy
from spacy.matcher import PhraseMatcher
import re

nlp = spacy.load("en_core_web_trf")
# Read skills from a text file
with open("skills.txt", "r", encoding="utf-8") as f:
    skills = [line.strip() for line in f if line.strip()]

skill_matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
skill_matcher.add("SKILLS", [nlp.make_doc(skill) for skill in skills])

st.title("Infro Extractor From Resume✨")

uploaded_file = st.file_uploader("Choose a file")

if uploaded_file is not None:
    try:
        doc = fitz.open(stream=uploaded_file.read(), filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\f"

        
        spacy_doc = nlp(text)

        name = "Not Found"
        for ent in spacy_doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text
                break

        st.write("Name: " + name)

        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        email = email_match.group() if email_match else "Not Found"
        st.write("Email Address: " + email)

        skill_matches = skill_matcher(spacy_doc)
        extracted_skills = set()
        for match_id, start, end in skill_matches:
            span = spacy_doc[start:end]
            extracted_skills.add(span.text.title())

        st.write("Skills: ", extracted_skills)


    except Exception as e:
        st.error(f"Failed to read file! Please make sure the file is a valid document (.PDF or .DOCX).\nError: {e}")
