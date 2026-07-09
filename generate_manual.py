import os
import re

INPUT_FILE = "MANUEL_SOUTENANCE_LUMO_FINAL.md"
OUTPUT_FILE = "MANUEL_SOUTENANCE_LUMO_300_PAGES.html"

print("Génération du manuel universitaire en cours...")

if not os.path.exists(INPUT_FILE):
    print(f"Erreur : Le fichier d'entrée {INPUT_FILE} n'existe pas.")
    exit(1)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    markdown_content = f.read()

# Extraction de la table des matières et du corps du document (on ignore la couverture brute du markdown)
idx = markdown_content.upper().find('## TABLE DES MATIÈRES')
if idx != -1:
    body_markdown = markdown_content[idx:]
else:
    body_markdown = markdown_content

def parse_inline(text):
    # Échappement des caractères HTML de base
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Codes en ligne: `code`
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    
    # Gras: **texte** ou __texte__
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'__([^_]+)__', r'<strong>\1</strong>', text)
    
    # Italique: *texte* ou _texte_
    text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
    text = re.sub(r'_([^_]+)_', r'<em>\1</em>', text)
    
    # Liens: [texte](url)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    
    return text

def markdown_to_html(md_text):
    lines = md_text.split('\n')
    html_lines = []
    
    in_code_block = False
    code_content = []
    code_lang = ""
    
    in_list = False
    in_ordered_list = False
    
    in_table = False
    table_headers = []
    table_rows = []
    
    in_quote = False
    quote_lines = []
    
    for line in lines:
        # Détection des blocs de code
        if line.strip().startswith('```'):
            if in_code_block:
                html_lines.append(f'<pre><code class="language-{code_lang}">' + '\n'.join(code_content) + '</code></pre>')
                in_code_block = False
                code_content = []
            else:
                in_code_block = True
                code_lang = line.strip()[3:]
            continue
            
        if in_code_block:
            escaped = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            code_content.append(escaped)
            continue
            
        # Détection des tableaux
        if line.strip().startswith('|'):
            in_table = True
            cells = [c.strip() for c in line.split('|')][1:-1]
            if not table_headers:
                table_headers = cells
            elif line.strip().replace(' ', '').replace('-', '').replace('|', '').replace(':', '') == '':
                # Ligne de séparation |---|---|
                pass
            else:
                table_rows.append(cells)
            continue
        elif in_table:
            html_lines.append('<table>')
            if table_headers:
                html_lines.append('<thead><tr>')
                for h in table_headers:
                    html_lines.append(f'<th>{parse_inline(h)}</th>')
                html_lines.append('</tr></thead>')
            if table_rows:
                html_lines.append('<tbody>')
                for row in table_rows:
                    html_lines.append('<tr>')
                    for cell in row:
                        html_lines.append(f'<td>{parse_inline(cell)}</td>')
                    html_lines.append('</tr>')
                html_lines.append('</tbody>')
            html_lines.append('</table>')
            in_table = False
            table_headers = []
            table_rows = []
            
        # Détection des citations et alertes
        if line.strip().startswith('>'):
            in_quote = True
            # On enlève le '>' initial
            quote_lines.append(line.strip()[1:].strip())
            continue
        elif in_quote:
            full_quote = ' '.join(quote_lines)
            alert_match = re.match(r'^\[!(IMPORTANT|WARNING|CAUTION|NOTE|TIP)\](.*)', full_quote)
            if alert_match:
                alert_type = alert_match.group(1).lower()
                alert_text = alert_match.group(2).strip()
                html_lines.append(f'<div class="alert-box {alert_type}"><div class="alert-title">{alert_type.upper()}</div><p>{parse_inline(alert_text)}</p></div>')
            else:
                html_lines.append(f'<blockquote>{parse_inline(full_quote)}</blockquote>')
            in_quote = False
            quote_lines = []
            
        # Détection des titres (Headings)
        if line.startswith('# '):
            heading_text = parse_inline(line[2:])
            # Saut de page pour chaque titre principal H1
            if len(html_lines) > 0:
                html_lines.append('<div class="page-break"></div>')
            html_lines.append(f'<h1>{heading_text}</h1>')
            continue
        elif line.startswith('## '):
            heading_text = parse_inline(line[3:])
            html_lines.append(f'<h2>{heading_text}</h2>')
            continue
        elif line.startswith('### '):
            heading_text = parse_inline(line[4:])
            html_lines.append(f'<h3>{heading_text}</h3>')
            continue
        elif line.startswith('#### '):
            heading_text = parse_inline(line[5:])
            html_lines.append(f'<h4>{heading_text}</h4>')
            continue
            
        # Séparateur / Saut de page forcé
        if line.strip() == '---':
            html_lines.append('<div class="page-break"></div>')
            continue
            
        # Détection des listes à puces
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            if not in_list:
                html_lines.append('<ul>')
                in_list = True
            content = line.strip()[2:]
            html_lines.append(f'<li>{parse_inline(content)}</li>')
            continue
        elif in_list:
            html_lines.append('</ul>')
            in_list = False
            
        # Détection des listes ordonnées
        ordered_match = re.match(r'^\d+\.\s+(.*)', line.strip())
        if ordered_match:
            if not in_ordered_list:
                html_lines.append('<ol>')
                in_ordered_list = True
            content = ordered_match.group(1)
            html_lines.append(f'<li>{parse_inline(content)}</li>')
            continue
        elif in_ordered_list:
            html_lines.append('</ol>')
            in_ordered_list = False
            
        # Paragraphes normaux
        if line.strip():
            html_lines.append(f'<p>{parse_inline(line)}</p>')
            
    # Fermeture des structures ouvertes à la fin du fichier
    if in_list:
        html_lines.append('</ul>')
    if in_ordered_list:
        html_lines.append('</ol>')
    if in_table:
        html_lines.append('</table>')
    if in_quote:
        html_lines.append(f'<blockquote>{parse_inline(" ".join(quote_lines))}</blockquote>')
        
    return '\n'.join(html_lines)

body_html = markdown_to_html(body_markdown)

html_content = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>MANUEL ACADÉMIQUE DE SOUTENANCE - PLATEFORME LUMO</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');
        
        body {{
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }}

        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            padding: 50px 70px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }}

        h1, h2, h3, h4 {{
            color: #0f172a;
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            page-break-after: avoid;
        }}

        h1 {{
            font-size: 28pt;
            border-bottom: 3px double #3b82f6;
            padding-bottom: 12px;
            margin-top: 50px;
            text-align: center;
            text-transform: uppercase;
            color: #1e3a8a;
        }}

        h2 {{
            font-size: 20pt;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 40px;
            color: #2563eb;
        }}

        h3 {{
            font-size: 15pt;
            margin-top: 30px;
            color: #1d4ed8;
        }}

        h4 {{
            font-size: 12pt;
            margin-top: 20px;
            color: #1e40af;
        }}

        p, li {{
            text-align: justify;
        }}

        code {{
            font-family: 'Fira Code', monospace;
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9.5pt;
            color: #0f172a;
        }}

        pre {{
            font-family: 'Fira Code', monospace;
            background-color: #0f172a;
            color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            font-size: 9pt;
            overflow-x: auto;
            border-left: 5px solid #3b82f6;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
        }}

        table, th, td {{
            border: 1px solid #cbd5e1;
        }}

        th {{
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
            padding: 10px;
            text-align: left;
        }}

        td {{
            padding: 10px;
            vertical-align: top;
        }}

        .alert-box {{
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
            border-left: 6px solid #2563eb;
            background-color: #eff6ff;
        }}
        
        .alert-box.note {{
            border-left-color: #2563eb;
            background-color: #eff6ff;
        }}
        
        .alert-box.tip {{
            border-left-color: #16a34a;
            background-color: #f0fdf4;
        }}
        
        .alert-box.important {{
            border-left-color: #7c3aed;
            background-color: #f5f3ff;
        }}
        
        .alert-box.warning {{
            border-left-color: #d97706;
            background-color: #fffbeb;
        }}
        
        .alert-box.caution {{
            border-left-color: #dc2626;
            background-color: #fef2f2;
        }}

        .alert-title {{
            font-weight: 700;
            margin-bottom: 5px;
            color: #0f172a;
            font-size: 10pt;
            text-transform: uppercase;
        }}

        .page-break {{
            page-break-after: always;
        }}

        .cover-page {{
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: radial-gradient(circle, #f8fafc 0%, #cbd5e1 100%);
            padding: 40px;
            page-break-after: always;
        }}

        .cover-university {{
            font-size: 16pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #1e3a8a;
        }}

        .cover-faculty {{
            font-size: 12pt;
            text-transform: uppercase;
            margin-top: 10px;
            color: #475569;
        }}

        .cover-title {{
            font-size: 26pt;
            margin: 80px 0 30px 0;
            color: #0f172a;
            font-family: 'Playfair Display', serif;
            font-weight: 800;
            line-height: 1.3;
        }}

        .cover-subtitle {{
            font-size: 14pt;
            color: #2563eb;
            margin-bottom: 80px;
        }}

        .cover-authors {{
            margin-top: auto;
            font-size: 12pt;
            color: #334155;
            line-height: 1.8;
        }}

        .cover-footer {{
            margin-top: 50px;
            font-size: 10pt;
            color: #64748b;
        }}

        @media print {{
            body {{
                background-color: #ffffff;
                font-size: 11pt;
            }}
            .container {{
                box-shadow: none;
                padding: 0;
                max-width: 100%;
            }}
            .page-break {{
                page-break-after: always;
            }}
            @page {{
                size: A4;
                margin: 20mm;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- PAGE DE COUVERTURE ACADÉMIQUE -->
        <div class="cover-page">
            <div class="cover-university">République Démocratique du Congo</div>
            <div class="cover-faculty">Enseignement Supérieur et Universitaire<br>Institut Supérieur de Techniques Appliquées</div>
            <div class="cover-title">CONCEPTION ET DÉVELOPPEMENT D'UNE PLATEFORME WEB INTELLIGENTE DE GESTION CENTRALISÉE ET AUTOMATISÉE DES ACTIVITÉS COMMERCIALES (LUMO)</div>
            <div class="cover-subtitle">Mémoire présenté en vue de l'obtention du diplôme de Licence LMD en Technique de Maintenance</div>
            <div class="cover-authors">
                <strong>Présenté par :</strong><br>
                René NZAKU, Gracien et l'Équipe Projet LUMO<br><br>
                <strong>Sous la direction de :</strong><br>
                Le Corps Enseignant ISTA
            </div>
            <div class="cover-footer">Année Académique 2025 - 2026</div>
        </div>

        <!-- CONTENU DU MANUEL PARSE DEPUIS LE MARKDOWN -->
        {body_html}
        
        <!-- EN-TÊTE DE FIN DE MANUEL -->
        <div style="text-align: center; margin-top: 50px; border-top: 2px solid #e2e8f0; padding-top: 30px;">
            <p style="font-family: 'Playfair Display', serif; font-size: 16pt; font-weight: 700; color: #1e3a8a;">FIN DU MANUEL DE PREPARATION UNIVERSITAIRE</p>
            <p style="font-size: 10pt; color: #64748b;">Généré avec succès pour René Nzaku et l'Équipe LUMO - ISTA 2026</p>
        </div>
    </div>
</body>
</html>
"""

try:
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Fichier {OUTPUT_FILE} généré avec succès !")
except Exception as e:
    print(f"Erreur lors de la génération du fichier : {e}")
