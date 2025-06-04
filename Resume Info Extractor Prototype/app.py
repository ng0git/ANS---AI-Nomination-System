import streamlit as st
import fitz
import spacy
from spacy.matcher import PhraseMatcher
import re

nlp = spacy.load("en_core_web_trf")

st.title("Info Extractor From Resume✨")

# Initialize the skill matcher
skill_matcher = PhraseMatcher(nlp.vocab, attr="LOWER")

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

        # Add a text box for users to input skills (moved below name and email)
        user_skills_input = st.text_area("Enter skills or keywords to identify (comma-separated):")

        # Add user-provided skills to the matcher
        if user_skills_input:
            user_skills = [skill.strip() for skill in user_skills_input.split(",") if skill.strip()]
            skill_matcher.add("SKILLS", [nlp.make_doc(skill) for skill in user_skills])

        skill_matches = skill_matcher(spacy_doc)
        extracted_skills = set()
        for match_id, start, end in skill_matches:
            span = spacy_doc[start:end]
            extracted_skills.add(span.text.title())

        # Display skills as a nicely formatted list
        if extracted_skills:
            st.write("Skills:")
            for skill in sorted(extracted_skills):
                st.write(f"- {skill}")
        else:
            st.write("Skills: None found")

        # Calculate and display the score
        if user_skills_input:
            total_user_skills = len(user_skills)
            matched_skills = len(extracted_skills)
            score = (matched_skills / total_user_skills) * 100 if total_user_skills > 0 else 0
            st.write(f"Skill Match Score: {score:.2f}%")

    except Exception as e:
        st.error(f"Failed to read file! Please make sure the file is a valid document (.PDF or .DOCX).\nError: {e}")