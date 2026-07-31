import { Card, CardContent, Typography, Grid } from "@mui/material";

function Statistics() {
  const stats = [
    { title: "Total Sales", value: "NPR 120,000", color: "#2E7D32" },
    { title: "Active Customers", value: "350", color: "#388E3C" },
    { title: "Pending Orders", value: "42", color: "#FBC02D" },
    { title: "Low Stock Alerts", value: "7", color: "#D32F2F" },
  ];

  return (
    <div style={{ padding: "2rem", backgroundColor: "#FAFAF5", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom>Statistics</Typography>
      <Grid container spacing={3} style={{ marginTop: "1rem" }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card style={{ backgroundColor: stat.color, color: "white" }}>
              <CardContent>
                <Typography variant="h6">{stat.title}</Typography>
                <Typography variant="h5" style={{ fontWeight: "bold" }}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Statistics;
