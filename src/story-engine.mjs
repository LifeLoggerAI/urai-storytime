const blocked=["violence","blood","weapon","abuse","hate"];
export function moderatePrompt(input=''){const text=input.toLowerCase();const hits=blocked.filter(w=>text.includes(w));return{safe:hits.length===0,hits};}
export function generateStory({childName,theme,mood,narrator,prompt}){const safe=moderatePrompt(prompt);if(!safe.safe) throw new Error(`Please remove unsafe words: ${safe.hits.join(', ')}`);
const id=`story_${Date.now()}`;
const title=`${childName}'s ${theme} Adventure`;
const body=`Tonight, ${childName} and a ${mood} firefly explored ${theme}. Guided by ${narrator}, they learned kindness, courage, and wonder.`;
return {id,title,body,narrator,mood,theme,createdAt:new Date().toISOString()};}
