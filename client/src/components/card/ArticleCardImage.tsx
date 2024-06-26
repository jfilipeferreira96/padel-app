import { Paper, Text, Title, Button, Badge, Group, Box } from "@mantine/core";
import classes from "./ArticleCardImage.module.css";

export function ArticleCardImage() {
  return (
    <div>
      <Paper shadow="md" p="xl" radius="md" className={classes.card}>
      </Paper>
      <Box pl={5} pr={5}>
        <Group justify="space-between" mt="md" mb="xs" align="center">
          <Text fw={500}>Cartão Off Pick - Janeiro</Text>
        </Group>

        <Text fz="xl" fw={700} style={{ lineHeight: 1 }}>
          50 €
        </Text>
      </Box>
    </div>
  );
}
