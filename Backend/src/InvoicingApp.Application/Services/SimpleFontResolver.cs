using PdfSharp.Fonts;

namespace InvoicingApp.Application.Services
{
    // A simple font resolver for PdfSharp that doesn't require System.Drawing
    public class SimpleFontResolver : IFontResolver
    {
        public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic)
        {
            // Always use standard PDF fonts
            if (isBold && isItalic)
                return new FontResolverInfo("Times#bi");
            if (isBold)
                return new FontResolverInfo("Times#b");
            if (isItalic)
                return new FontResolverInfo("Times#i");
            return new FontResolverInfo("Times#");
        }

        public byte[] GetFont(string faceName)
        {
            // Return an empty byte array to indicate using standard fonts
            return new byte[0];
        }
    }
}
