using PdfSharp.Fonts;
using System.Collections.Generic;
using System.IO;
using System.Reflection;

namespace PdfSharp.Fonts
{
    // A simple font resolver that uses embedded fonts
    public class FontResolver : IFontResolver
    {
        // Dictionary to cache font data
        private static readonly Dictionary<string, byte[]> FontDataCache = new Dictionary<string, byte[]>();

        // Return a font data based on the name parameter
        public byte[] GetFont(string faceName)
        {
            if (FontDataCache.TryGetValue(faceName, out var fontData))
            {
                return fontData;
            }

            // Default to Arial if not found
            return new byte[0]; // Empty array will use the default PDF fonts
        }

        // Returns information whether a font exists and what name it has
        public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic)
        {
            // You can use this to map font family names to specific fonts
            string name = "Arial";
            
            if (familyName.Equals("Arial", System.StringComparison.OrdinalIgnoreCase) ||
                familyName.Equals("sans-serif", System.StringComparison.OrdinalIgnoreCase))
            {
                name = "Arial";
            }
            
            if (isBold && isItalic)
                return new FontResolverInfo(name + "-BoldItalic");
            if (isBold)
                return new FontResolverInfo(name + "-Bold");
            if (isItalic)
                return new FontResolverInfo(name + "-Italic");
            
            return new FontResolverInfo(name);
        }
    }
}
