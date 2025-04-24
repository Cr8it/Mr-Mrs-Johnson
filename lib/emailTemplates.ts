export function generateInviteEmailTemplate(guest: { name: string, household: { code: string } }) {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<style>
				body { 
					font-family: Arial, sans-serif;
					line-height: 1.6;
					color: #333;
					margin: 0;
					padding: 0;
					background-color: #f9f9f9;
				}
				.container {
					max-width: 600px;
					margin: 0 auto;
					padding: 20px;
					background-color: #fff;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}
				.header {
					text-align: center;
					padding: 0;
					margin-bottom: 30px;
					position: relative;
				}
				.header:after {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2));
					border-radius: 8px;
				}
				.header img {
					width: 100%;
					max-height: 300px;
					object-fit: cover;
					border-radius: 8px;
				}
				.content {
					padding: 30px 20px;
					text-align: center;
					background: linear-gradient(to bottom, #ffffff, #f8f8f8);
					border-radius: 8px;
				}
				.title {
					font-size: 32px;
					color: #333;
					margin-bottom: 20px;
					font-family: 'Times New Roman', serif;
					font-style: italic;
				}
				.details {
					font-size: 18px;
					margin-bottom: 30px;
					color: #666;
					line-height: 1.8;
				}
				.code-box {
					background: linear-gradient(135deg, #f8f8f8, #ffffff);
					padding: 20px;
					border-radius: 8px;
					margin: 20px 0;
					text-align: center;
					border: 1px solid #eaeaea;
					box-shadow: 0 2px 4px rgba(0,0,0,0.05);
				}
				.code {
					font-size: 28px;
					font-weight: bold;
					color: #333;
					letter-spacing: 3px;
					margin: 10px 0;
				}
				.footer {
					text-align: center;
					padding: 30px 20px;
					font-size: 14px;
					color: #666;
					border-top: 1px solid #eaeaea;
					margin-top: 30px;
				}
				.button {
					display: inline-block;
					padding: 14px 28px;
					background: linear-gradient(135deg, #d4af37, #f2d472);
					color: white;
					text-decoration: none;
					border-radius: 4px;
					margin: 20px 0;
					font-weight: bold;
					text-transform: uppercase;
					letter-spacing: 1px;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}
				.note {
					font-style: italic;
					color: #888;
					font-size: 14px;
					margin-top: 30px;
					padding: 15px;
					border-top: 1px solid #eaeaea;
					border-bottom: 1px solid #eaeaea;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<img src="https://mrandmrsjohnson.co.uk/uploads/RINGWATCH.PNG" alt="Sarah and Jermaine" />
				</div>
				<div class="content">
					<h1 class="title">Sarah & Jermaine's Wedding</h1>
					<p class="details">
						Dear ${guest.name},<br><br>
						With joy in our hearts, we invite you to celebrate<br>
						our wedding ceremony and reception on<br>
						<strong>Friday 24th October 2025</strong><br>
						at<br>
						<strong>Westernham Golf Club</strong><br>
						Brasted Rd, Westerham TN16, UK
					</p>
					<div class="code-box">
						<p style="margin: 0; color: #666;">Your Family Code</p>
						<p class="code">${guest.household.code}</p>
					</div>
					<p>
						To RSVP, please visit our wedding website using the unlock code:<br>
						<strong style="font-size: 20px; color: #d4af37;">010424</strong>
					</p>
					<a href="https://mrandmrsjohnson.co.uk" class="button">Visit Wedding Website</a>
					<p class="note">
						Please note: Unfortunately, we cannot accommodate any children.<br>
						Only named guests will be permitted entry.
					</p>
				</div>
				<div class="footer">
					<p style="font-size: 16px; margin-bottom: 5px;">With love,</p>
					<p style="font-size: 20px; font-family: 'Times New Roman', serif; font-style: italic; margin-top: 0;">Sarah & Jermaine</p>
				</div>
			</div>
		</body>
		</html>
	`;
}