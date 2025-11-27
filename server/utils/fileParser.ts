import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import { validatePhoneNumber } from '../services/bolna';

export interface ParsedContact {
  name: string;
  phone: string;
  city?: string;
  email?: string;
  notes?: string;
}

export interface ParseResult {
  success: boolean;
  contacts: ParsedContact[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse CSV file and extract contacts
 */
export async function parseCSV(filePath: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    const contacts: ParsedContact[] = [];
    const errors: string[] = [];
    let totalRows = 0;
    let validRows = 0;

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: any) => {
        totalRows++;
        
        try {
          // Try different possible column names (case-insensitive)
          const name = row.name || row.Name || row.NAME || 
                       row.contactName || row['Contact Name'] || 
                       row.fullName || row['Full Name'] || '';
          
          const phone = row.phone || row.Phone || row.PHONE || 
                        row.phoneNumber || row['Phone Number'] || 
                        row.mobile || row.Mobile || 
                        row.contact || row.Contact || '';
          
          const city = row.city || row.City || row.CITY || '';
          const email = row.email || row.Email || row.EMAIL || '';
          const notes = row.notes || row.Notes || row.NOTES || 
                       row.description || row.Description || '';

          // Validate required fields
          if (!name || !name.trim()) {
            errors.push(`Row ${totalRows}: Missing name`);
            return;
          }

          if (!phone || !phone.trim()) {
            errors.push(`Row ${totalRows}: Missing phone number`);
            return;
          }

          // Validate phone format
          if (!validatePhoneNumber(phone.trim())) {
            errors.push(`Row ${totalRows}: Invalid phone number format: ${phone}`);
            return;
          }

          contacts.push({
            name: name.trim(),
            phone: phone.trim(),
            city: city?.trim() || undefined,
            email: email?.trim() || undefined,
            notes: notes?.trim() || undefined,
          });

          validRows++;
        } catch (error: any) {
          errors.push(`Row ${totalRows}: ${error.message}`);
        }
      })
      .on('end', () => {
        console.log(`CSV parsing complete: ${validRows}/${totalRows} valid contacts`);
        resolve({
          success: true,
          contacts,
          errors,
          totalRows,
          validRows,
        });
      })
      .on('error', (error: Error) => {
        console.error('CSV parsing error:', error);
        resolve({
          success: false,
          contacts: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          totalRows: 0,
          validRows: 0,
        });
      });
  });
}

/**
 * Parse Excel file (XLSX, XLS) and extract contacts
 */
export async function parseExcel(filePath: string): Promise<ParseResult> {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows: any[] = xlsx.utils.sheet_to_json(worksheet);
    
    const contacts: ParsedContact[] = [];
    const errors: string[] = [];
    let totalRows = rows.length;
    let validRows = 0;

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // Excel rows start at 1, +1 for header
      
      try {
        // Try different possible column names (case-insensitive)
        const name = row.name || row.Name || row.NAME || 
                     row.contactName || row['Contact Name'] || 
                     row.fullName || row['Full Name'] || '';
        
        const phone = row.phone || row.Phone || row.PHONE || 
                      row.phoneNumber || row['Phone Number'] || 
                      row.mobile || row.Mobile || 
                      row.contact || row.Contact || '';
        
        const city = row.city || row.City || row.CITY || '';
        const email = row.email || row.Email || row.EMAIL || '';
        const notes = row.notes || row.Notes || row.NOTES || 
                     row.description || row.Description || '';

        // Validate required fields
        if (!name || !name.toString().trim()) {
          errors.push(`Row ${rowNumber}: Missing name`);
          return;
        }

        if (!phone || !phone.toString().trim()) {
          errors.push(`Row ${rowNumber}: Missing phone number`);
          return;
        }

        const phoneStr = phone.toString().trim();

        // Validate phone format
        if (!validatePhoneNumber(phoneStr)) {
          errors.push(`Row ${rowNumber}: Invalid phone number format: ${phoneStr}`);
          return;
        }

        contacts.push({
          name: name.toString().trim(),
          phone: phoneStr,
          city: city?.toString().trim() || undefined,
          email: email?.toString().trim() || undefined,
          notes: notes?.toString().trim() || undefined,
        });

        validRows++;
      } catch (error: any) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    });

    console.log(`Excel parsing complete: ${validRows}/${totalRows} valid contacts`);

    return {
      success: true,
      contacts,
      errors,
      totalRows,
      validRows,
    };
  } catch (error: any) {
    console.error('Excel parsing error:', error);
    return {
      success: false,
      contacts: [],
      errors: [`Failed to parse Excel: ${error.message}`],
      totalRows: 0,
      validRows: 0,
    };
  }
}

/**
 * Parse file based on extension
 */
export async function parseContactFile(filePath: string): Promise<ParseResult> {
  const ext = path.extname(filePath).toLowerCase();
  
  console.log(`📄 Parsing file: ${filePath} (${ext})`);

  if (ext === '.csv') {
    return await parseCSV(filePath);
  } else if (ext === '.xlsx' || ext === '.xls') {
    return await parseExcel(filePath);
  } else {
    return {
      success: false,
      contacts: [],
      errors: [`Unsupported file format: ${ext}. Please use CSV, XLSX, or XLS.`],
      totalRows: 0,
      validRows: 0,
    };
  }
}

/**
 * Check for duplicate contacts in database
 */
export function findDuplicates(
  newContacts: ParsedContact[],
  existingContacts: { phone: string }[]
): string[] {
  const existingPhones = new Set(existingContacts.map(c => c.phone));
  const duplicates: string[] = [];

  newContacts.forEach(contact => {
    if (existingPhones.has(contact.phone)) {
      duplicates.push(contact.phone);
    }
  });

  return duplicates;
}
