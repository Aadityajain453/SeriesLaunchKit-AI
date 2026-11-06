/** Renders a series plan to a branded PDF and streams it to the response. */
const PDFDocument = require('pdfkit');
const { SERIES_FIELDS } = require('../../config/seriesFields');

const BRAND = '#1f2a14';
const ACCENT = '#7fa31a';
const MUTED = '#6b7280';

function streamSeriesPdf(series, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 56, bufferPages: true, info: { Title: series.title, Author: 'SeriesLaunchKit AI' } });
  doc.pipe(res);

  const width = doc.page.width - 112;
  const heading = (text) => {
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.moveDown(0.8).fillColor(ACCENT).font('Helvetica-Bold').fontSize(14).text(text.toUpperCase(), { characterSpacing: 1 });
    doc.moveTo(56, doc.y + 2).lineTo(56 + width, doc.y + 2).strokeColor('#e5e7eb').lineWidth(1).stroke();
    doc.moveDown(0.5).fillColor(BRAND).font('Helvetica').fontSize(11);
  };
  const para = (text) => { if (text) doc.font('Helvetica').fontSize(11).fillColor('#111827').text(text, { align: 'left', lineGap: 3 }).moveDown(0.4); };
  const label = (k, v) => {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED).text(`${k}: `, { continued: true })
      .font('Helvetica').fillColor('#111827').text(String(v));
  };

  // Cover
  doc.rect(0, 0, doc.page.width, 200).fill(BRAND);
  doc.fillColor('#d9f99d').font('Helvetica-Bold').fontSize(10).text('SERIESLAUNCHKIT AI · SERIES BIBLE', 56, 60, { characterSpacing: 2 });
  doc.fillColor('#ffffff').fontSize(26).text(series.title, 56, 85, { width });
  if (series.content?.logline) doc.font('Helvetica-Oblique').fontSize(12).fillColor('#e5e7eb').text(series.content.logline, { width });
  doc.y = 230;
  doc.fillColor(BRAND);

  heading('Series Details');
  SERIES_FIELDS.forEach((f) => {
    const v = series.inputs?.[f.key];
    if (v !== undefined && v !== '' && f.key !== 'title') label(f.label, v);
  });

  const c = series.content || {};
  if (c.synopsis) { heading('Synopsis'); para(c.synopsis); }
  if (c.themes?.length) { heading('Themes'); para(c.themes.join(' · ')); }
  if (c.characters?.length) {
    heading('Characters');
    c.characters.forEach((ch) => {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND).text(`${ch.name}${ch.role ? ` — ${ch.role}` : ''}`);
      para(ch.description);
    });
  }
  if (c.episodes?.length) {
    heading('Episodes');
    c.episodes.forEach((ep) => {
      if (doc.y > doc.page.height - 160) doc.addPage();
      doc.font('Helvetica-Bold').fontSize(12).fillColor(BRAND).text(`Episode ${ep.number}: ${ep.title}`).moveDown(0.2);
      if (ep.hook) label('Hook', ep.hook);
      para(ep.summary);
      (ep.keyBeats || []).forEach((b) => doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`•  ${b}`, { indent: 10 }));
      if (ep.videoPrompt) { doc.moveDown(0.3); label('Video prompt', ep.videoPrompt); }
      if (ep.script) {
        doc.moveDown(0.3).font('Helvetica-Bold').fontSize(10).fillColor(MUTED).text('SCRIPT');
        doc.font('Courier').fontSize(9).fillColor('#111827').text(ep.script, { lineGap: 2 });
      }
      doc.moveDown(0.8);
    });
  }
  const m = c.marketing || {};
  if (m.tagline || m.hashtags?.length || m.thumbnailIdeas?.length) {
    heading('Marketing Kit');
    if (m.tagline) label('Tagline', m.tagline);
    if (m.hashtags?.length) label('Hashtags', m.hashtags.join(' '));
    (m.thumbnailIdeas || []).forEach((t) => doc.font('Helvetica').fontSize(10).fillColor('#374151').text(`•  ${t}`, { indent: 10 }));
  }

  // Footer with page numbers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // allow writing in the footer area without creating a new page
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(`${series.title} · Page ${i + 1} of ${range.count}`, 56, doc.page.height - 40, { width, align: 'center', lineBreak: false });
  }
  doc.end();
}

module.exports = { streamSeriesPdf };
