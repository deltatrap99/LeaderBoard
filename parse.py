import zipfile
import xml.etree.ElementTree as ET
import re

def parse_xlsx(filename, target_sheet_name):
    with zipfile.ZipFile(filename, 'r') as z:
        # Get shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'ns': root.tag.split('}')[0].strip('{')}
            for si in root.findall('ns:si', ns):
                t = si.find('ns:t', ns)
                if t is not None:
                    shared_strings.append(t.text or '')
                else:
                    texts = [x.text for x in si.findall('.//ns:t', ns) if x.text]
                    shared_strings.append(''.join(texts))

        # Get workbook to map sheet name to sheet id
        root = ET.fromstring(z.read('xl/workbook.xml'))
        ns = {'ns': root.tag.split('}')[0].strip('{')}
        sheet_path = None
        for sheet in root.findall('.//ns:sheet', ns):
            if target_sheet_name.lower() in sheet.attrib.get('name', '').lower():
                sheet_id = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                # Find the target in _rels/workbook.xml.rels
                rels_root = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
                rels_ns = {'ns': rels_root.tag.split('}')[0].strip('{')}
                for rel in rels_root.findall('ns:Relationship', rels_ns):
                    if rel.attrib.get('Id') == sheet_id:
                        sheet_path = 'xl/' + rel.attrib.get('Target')
                        break
                break
        
        if not sheet_path:
            print("Sheet not found.")
            return

        # Parse sheet
        root = ET.fromstring(z.read(sheet_path))
        ns = {'ns': root.tag.split('}')[0].strip('{')}
        for row in root.findall('.//ns:row', ns):
            row_data = []
            for c in row.findall('ns:c', ns):
                val = c.find('ns:v', ns)
                if val is not None:
                    t = c.attrib.get('t', '')
                    if t == 's':
                        idx = int(val.text)
                        row_data.append(shared_strings[idx].strip().replace('\n', ' '))
                    else:
                        row_data.append(val.text)
                else:
                    row_data.append('')
            if any(row_data):
                print(' | '.join(row_data))

parse_xlsx('sheet_temp.xlsx', 'Diễn giải Tháng 5')
