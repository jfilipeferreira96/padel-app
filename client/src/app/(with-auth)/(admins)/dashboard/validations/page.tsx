"use client";
import React, { useState, useEffect } from "react";
import { Paper, Table, Checkbox, Pagination as MantinePagination, Center, Text, Select, Flex, Badge, SimpleGrid, Skeleton, Grid } from "@mantine/core";
import QrReader from "@/components/qrcode-reader";


function Validations(){

  return (
    <>
      <h1>Validações</h1>
      <QrReader />
    </>
      
  );
}

export default Validations;
