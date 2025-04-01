// Script to fetch and display all Dzine API styles
import { getDzineStyles } from '../services/dzineService';

async function fetchAndDisplayStyles() {
  console.log('Fetching all Dzine API styles...');
  try {
    const data = await getDzineStyles();
    
    if (data && data.list && data.list.length > 0) {
      console.log(`Retrieved ${data.list.length} styles from Dzine API`);
      
      // Sort styles alphabetically by name
      const sortedStyles = [...data.list].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      console.log('\nFULL LIST OF DZINE API STYLES:');
      console.log('==========================\n');
      
      sortedStyles.forEach((style, index) => {
        console.log(`${index + 1}. ${style.name}`);
        console.log(`   Style Code: ${style.style_code}`);
        console.log(`   Base Model: ${style.base_model || 'N/A'}`);
        if (style.style_intensity) {
          console.log(`   Intensity: img2img=${style.style_intensity.img2img}, txt2img=${style.style_intensity.txt2img}`);
        }
        if (style.cover_url) {
          console.log(`   Cover Image: ${style.cover_url}`);
        }
        console.log('---');
      });
      
      console.log('\nJSON FORMAT FOR COPY/PASTE:');
      console.log(JSON.stringify(sortedStyles.map(s => ({
        name: s.name,
        style_code: s.style_code,
        base_model: s.base_model
      })), null, 2));
      
    } else {
      console.error('No styles available from the API');
    }
  } catch (error) {
    console.error('Error fetching styles:', error);
  }
}

// Execute the function
fetchAndDisplayStyles(); 